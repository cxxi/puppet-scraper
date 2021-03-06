'use strict'

import fs from 'fs'


const defaultOptions = {
	rawResult: false,
	quiet: false, // useless ?
	merge: false,
	sort: false,
	timeout: 3600000,
	debug: false,
	_dlSeparator: '>'
}

class Abstract
{
	constructor(options)
	{
		if (this.constructor.name === Abstract.constructor.name) {
			throw `Abstract class "${Abstract.constructor.name}" cannot be instantiated directly`
		}

		Object.defineProperty(this, 'rootPath', {
			configurable: false,
			writable: false,
			value: import.meta.url.match(/^file:\/\/(.*puppet-scraper\/)/)[1]
		})

		this.options = options
		Object.defineProperty(this.options, '_apply', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: option => {
				this.options = Utils.deepAssign(this.options, option)
			}
		})

		Object.defineProperty(this.options, '_dlSeparator', {
			enumerable: this.options.debug,
			configurable: true,
			writable: true,
			value: this.options._dlSeparator
		})
	}

	_initialization(options)
	{
		this.options._apply(options)
		this.tasksManager = new TasksManager(this.options)
	}

	async _loadScript(target)
	{
		if (!target.startsWith('/')) {
			throw `Invalid path, should be absolute (${target})`
		}

		if (await !fs.existsSync(target)) {
			throw `Method mount received an invalid path (${target})`
		}

		if ((fs.statSync(target)).isDirectory()) {
			return await Promise.all(fs.readdirSync(target).map(async s => {
				return this.tasksManager.build(await import(`${target}/${s}`))
			}))
		} 

		if ((fs.statSync(target)).isFile()) {
			return this.tasksManager.build(await import(target))
		}
	}

	_err(err)
	{
		Monitor.renderError(err)
	}
}

class Task
{
	constructor(name = false)
	{
		if (name.constructor !== String || name.length < 1) {
			throw 'Initialization failed'
		}

		this.parameters = {}
		this.startsTime = null
		this.endpoint   = null
		this.name       = null
		
		Object.defineProperty(this, 'name', {
			configurable: false,
			writable: false,
			value: name
		})

		function* _lifecycle(s = false)
		{
			let i = 0; while(true)
			{
				i = i === 6 ? 2 : i
				i = s.constructor === Number ? s : i
				yield i++
			}
		}

		const lifecycle = _lifecycle()
		this.state = null

		Object.defineProperty(this, '_up', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: _ => {

				switch(lifecycle.next().value)
				{
					case 0: this.state = 'notdefined';break
					case 1: this.state = 'defined'   ;break
					case 2: this.state = 'ready'     ;break
					case 3: this.state = 'pending'   ;break
					case 4: this.state = 'running'   ;break
					case 5: this.state = 'finished'  ;break
				}

				return this
			}
		})

		this.run = async _ => null
		this.result = {}

		Object.seal(this)
		return this._up()
	}

	define(parameters = {}, run)
	{
		if (parameters.endpoint.constructor !== String) {
			throw 'Invalid <parameters.endpoint>, must be a valid URL'
		}

		Object.defineProperty(this, 'endpoint', {
			configurable: false,
			writable: false,
			value: parameters.endpoint
		})

		delete parameters.endpoint

		if (parameters.constructor !== Object) {
			throw 'Invalid <parameters> argument must be an Object'
		}

		this.parameters = parameters

		if (run.constructor !== (async _ => {}).constructor) {
			throw 'Invalid <run> argument, must be an Async Function'
		}

		Object.defineProperty(this, 'run', {
			configurable: false,
			writable: false,
			value: run
		})

		return this._up()
	}
}

class TasksManager
{
	constructor(args = {})
	{
		this.queue = []
		this.shouldSort = false
		this.shouldMerge = false

		Object.defineProperty(this, 'shouldSort', {
			enumerable: false,
			value: args.sort === true
		})

		Object.defineProperty(this, 'shouldMerge', {
			enumerable: false,
			value: args.merge === true
		})
	}

	getTask(name = false)
	{	
		return name 
			? this.queue.filter(t => t.name == name)[0] 
			: (this.shouldSort ? this.sortQueue() : this.queue)
	}

	build(script)
	{
		return (new Task(script.name)).define(script.parameters, script.run)
	}

	list()
	{
		return this.shouldSort
			? this.sortQueue().map(t => t.name)
			: this.queue.map(t => t.name)
	}

	sortQueue()
	{
		const order = t => t.parameters.order

		if (this.queue.length == 0) throw 'The queue is empty'
		if (this.queue.filter(t => typeof order(t) === 'number').length !== this.queue.length) {
			throw `Disable <sort> option or specify <order> parameter on tasks`
		}
		
		return this.queue.sort((a, b) => order(a) - order(b))
	}

	async enqueue(tasks)
	{
		for (let task of tasks)
		{
			task = await this.check(task)
			this.queue.push(task._up())
			if (this.shouldSort) this.sortQueue()
			Monitor.out(`> ${Monitor.n} \x1b[36mEnqueue\x1b[0m Task #${this.queue.length} | ${task.name}\n`)
		}

		return true
	}
		
	async check(task)
	{
		for (const f of Array.isArray(task) ? task : [task])
		{
			if (f.name === undefined || f.name.constructor !==  String || f.name.length < 1) {
				throw `Script must export a constant "name" (String)`

			} else if (!(new RegExp('^([a-z0-9A-Z_-]+)$')).test(f.name)) {		
				throw `Constant "name" have to contains only Alphanumeric, capital, dash and underscore`

			}else if (typeof f.parameters !== 'object') {
				throw `Script must export a constant "parameters" (Object)`

			} else if (typeof f.endpoint !== 'string' || await !Utils.checkUrl(f.endpoint)) {
				throw `Parameter endpoint(${f.endpoint}) must be a valid URL`
			
			} else if (f.run === undefined || f.run.constructor !== (async _ => {}).constructor) {
				throw `Script must export an async function named "run"`
			}
		}
		return task
	}

	async getResult(name = false)
	{
		let unfinished = this.queue.filter(t => t.state != 'finished')
		let result = { v: {}, l: 0 }

		if (unfinished.length > 0){
			throw `Execution is not yet finished, there are ${unfinished.length} pending tasks`
		}

		if (this.shouldMerge) {

			result.v = this.queue[0].result.data
			for (let i=1;i<this.queue.length;i++)
			{
				result.v = await Utils.merge(result.v, this.queue[i].result.data)
			}

		} else {

			this.queue.forEach(task => result.v[task.name] = task.result.data)
		}

		// if (this.options.outputDir) {
		// 	await Utils.writeFile(`test.json`, result.v)
		// }

		return result
	}
}

class Utils
{
	constructor()
	{
		throw 'cant be instantie directory'
	}

	static async merge(data, patch)
	{
		data = Object.keys(data).length > 0 ? data : new (patch.constructor)()

		if (data.constructor !== patch.constructor) {
			throw `Invalid patch Constructor (${typeof patch.constructor})`
		}
		
		switch(patch.constructor)
		{
			case Array  : data = [].concat(data, patch); break
			case Object : data = Utils.deepAssign(data, patch); break
		}

		return data
	}

	static deepAssign(target, source)
	{
		for (const k of Object.keys(source)) 
		{
			if (source[k] instanceof Object && k in target) {
				Object.assign(source[k], Utils.deepAssign(target[k], source[k]))
			}
		}
		Object.assign(target || {}, source)
		return target
	}

	static walkObj(obj, keys)
	{
		let i = 0
		while(obj)
		{
			obj = Object.keys(obj).includes(keys[i]) ? obj[keys[i]] : false
			if (i == keys.length-1) return obj
			i++
		}
	}

	static async checkUrl(url, returnUrl = false)
	{
		const _check = url => { try { return Boolean(new URL(url)) } catch(e) { return false } }
		return returnUrl && _check(url) ? url : _check(url)
	}

	static async streamSetup(filename)
	{
		let dir = filename.split('/').slice(0, filename.split('/').length-1).join('/')
		await fs.existsSync(dir) || await fs.mkdirSync(dir, { recursive: true })
		return fs.createWriteStream(filename)
	}

	static async writeFile(filename, response, task = false)
	{
		// if (this.options.outputDir) {
		// 	await fs.writeFileSync(`${this.options.outputDir}/${filename}`, JSON.stringify(response, null, 2))
		// } else if (task) {
		// 	await fs.writeFileSync(`${task.parameters.outputDir}/${filename}`, JSON.stringify(response, null, 2))
		// }
	}
}

class Monitor
{
	static n = `[\x1b[34m\x1b[1mScraper\x1b[0m]`

	static out(a, b = 0)
	{
		switch(a.constructor)
		{
			case String: {
				process.stdout.write(a)
				for(let i=0;i<b;i++) process.stdout.write('\n')
				break
			}
			case Number: {
				for(let i=0;i<a;i++) process.stdout.write('\n')
				break
			}
		}
	}

	static runContext(options)
	{
		const refSize = Math.max(...Object.keys(options).map(o => o.length))+1

		Monitor.out(`\n> ${Monitor.n} \x1b[36mPrepare\x1b[0m to running the tasks in queue...`, 2)
		Monitor.out(`> ${Monitor.n} \x1b[36mOptions\x1b[0m`, 1)
		for (let [k, v] of Object.entries(options))
		{
			k = k+String(' ').repeat(refSize-k.length)
			Monitor.out(`> ${Monitor.n} \u0B9F\u1397 ${k}: ${v}`, 1)
		}
		Monitor.out(1)
	}

	static taskProcess(task, endline = false)
	{
		const format = state => {
			switch(state)
			{
				case 'ready'   : return `\x1b[43m\x1b[37m ${task.state}    \x1b[0m`
				case 'pending' : return `\x1b[43m\x1b[37m ${task.state}  \x1b[0m`
				case 'running' : return `\x1b[42m\x1b[37m ${task.state}  \x1b[0m`
				case 'finished': return `\x1b[46m\x1b[37m ${task.state} \x1b[0m`
			}
		}

		task._up()
		const baseStr = `> ${Monitor.n} ${format(task.state)}`
		task.state == 'finished'
			? process.stdout.write(baseStr)
			: process.stdout.write(`${baseStr}${String(' ').repeat(14)}| ${task.name}`)

		if (endline) process.stdout.write(`\n`)

		return task
	}

	static taskRuntime(task, time)
	{
		let t = time/1000,
			r = 12-(t.toString().length),
			d = `${String(' ').repeat(r)}${t}s |`

		process.stdout.write(`> ${Monitor.n} \x1b[42m\x1b[37m ${task.state}  \x1b[0m${d} ${task.name}`)
	}

	static renderError(e, code = false)
	{
		const color = `\x1b[31m`
		const head = code ? `[ERROR] #${code}` : `[ERROR]`
		console.error(new Error(`${color}${head}\n> ${e}\n`))
		process.exit(1)
	}

}

export { Abstract, defaultOptions, Task, TasksManager, Utils, Monitor }