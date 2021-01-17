'use strict'

import fs from 'fs'


const defaultOptions = {
	rawResult: false, 
	merge: false,
	sort: false,
	downloads: [],
	dlSeparator: '>'
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
	}

	_initialization(options)
	{
		this.options._apply(options)
		this.tasksManager = new TasksManager(this.options)
		// make setter for "sort" to update taskManager at same time.
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
		this.endpoint = null
		this.name = null
		
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
			console.log(`> [Scraper] Enqueue Task(${this.queue.length}) - ${task.name}`)
		}

		return true
	}
		
	async check(task)
	{
		for (const f of Array.isArray(task) ? task : [task])
		{
			if (typeof f.name != 'string' || f.name.length < 1) {
				// add verif uppercase + lowercase + _ + numeric
				throw `Script must export a constant "name" (String)`

			}else if (typeof f.parameters != 'object') {
				throw `Script must export a constant "parameters" (Object)`

			} else if (typeof f.endpoint != 'string' || await !Utils.checkUrl(f.endpoint)) {
				throw `Parameter <endpoint>(${f.endpoint}) must be a valid endpoint`

			// } else if (typeof f.parameters.order != 'number' && typeof f.parameters.order != 'string') {
			// 	throw `Parameter <order>(${f.parameters.order}) must be an number or a string`
			
			} else if (typeof f.run != 'function') {
				throw `Script must export a function "run"`
			}
		}

		// Need refect for support to state with param and without, (when callback can without)
		//
		// } else if (typeof m.parameters.outputDir != 'string' 
		// || !(await fs.statSync(m.parameters.outputDir)).isDirectory()) {
		// 	throw throw `Parameter <outputDir>(${m.parameters.outputDir}) must be a valid directory path`

		return task
	}

	async getResult(name = false)
	{
		let unfinished = this.queue.filter(t => t.state != 'finished')
		let result = {}

		if (unfinished.length > 0){
			throw `Execution is not yet finished, there are ${unfinished.length} pending tasks`
		}

		// maybe do in scraper ?
		// if (this.shouldMerge) {
		// 	let i = 0
		// 	while(i<this.queue.length)
		// 	{
		// 		await Utils.merge(this.queue[0+i].result.data, this.queue[1+i].result.data)
		// 		console.log(g)
		// 		i++
		// 	}
		// }

		// result.v = ''
		// result.v = ''

		return this.queue // TMP return result
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

	static async checkUrl(url)
	{
		try { return Boolean(new URL(url)) } catch(e) { return false }
	}
}

class Monitor
{
	static renderError(e, code = false)
	{
		const color = "\x1b[31m"
		const head = code ? `[ERROR] #${code}` : `[ERROR]`
		console.error(new Error(`${color}${head}\n> ${e}\n`))
		process.exit(1)
	}
}

export { Abstract, defaultOptions, Task, TasksManager, Utils, Monitor }

