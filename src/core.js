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
			throw new TypeError(`Abstract class "${Abstract.constructor.name}" cannot be instantiated directly`)
		}

		this.rootPath = import.meta.url.match(/^file:\/\/(.*puppet-scraper\/)/)[1]

		this.opt = options
		this.opt._apply = o => {
			this.opt = Utils._deepAssign(this.opt, o)
		}

		this.tasksManager = new TasksManager()
	}

	async _loadScript(target)
	{
		if (!target.startsWith('/')) {
			this._err(`Invalid path, should be absolute (${target})`)
		}

		if (await !fs.existsSync(target)) {
			this._err(`Method mount received an invalid path (${target})`)
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
}

class Task
{
	constructor(name = false)
	{
		if (name.constructor !== String || name.length < 1) {
			throw new Error('Initialization failed') 
		}
		this.name = name
		return this
	}

	define(params = {}, func)
	{
		if (params.endpoint === undefined || !Utils._checkUrl(params.endpoint)) {
			throw new Error('Invalid endpoint parameters')
		}
		this.endpoint = params.endpoint
		this.run = func
		this.parameters = params
		// Object.seal(this)
		return this
	}


	// set name(n) {
	// 	console.log(this)
	// 	if (!this.hasOwnProperty('name')){
	// 		this.name = n
	// 		// Object.defineProperty(this, 'name', {value: n })
	// 	}
	// }
}

class TasksManager
{
	constructor()
	{
		this.tasks = []
		// make weakmap
		this.sortable  = false
		// make updatable or not ?
	}

	getTask(name = false)
	{
		name ? this.tasks.filter(t => t.name == name)[0] : this.tasks 
	}

	list()
	{
		return this.tasks.map(t => t.name)
	}

	build(script)
	{
		return (new Task(script.name)).define(script.parameters, script.run)
	}

	sort(reverse = false)
	{
		// NEED REFACT
		if (this.tasks.length > 1 && this.options.sort) {
			const order = m => m.parameters.order
			this.tasks.sort((a, b) => {
				if (order(a) == undefined || order(b) == undefined) {
					this._err(`Disable <sort> option or specify <order> parameter on tasks`)
				}
				return order(a) - order(b)
			})
		}
	}

	async enqueue(tasks)
	{
		for (let task of tasks)
		{
			task = await this.check(task)
			this.tasks.push(task)
			console.log(`> Enqueue Task ${task.name} (${this.tasks.length} tasks in queue)\n`)
			if (this.sortable) this.sort()
		}
	}
		
	async check(task)
	{
		for (const f of Array.isArray(task) ? task : [task])
		{
			if (typeof f.name != 'string' || f.name.length < 1) {
				// add verif uppercase + lowercase + _ + numeric
				this._err(`Script must export a constant "name" (String)`)

			}else if (typeof f.parameters != 'object') {
				this._err(`Script must export a constant "parameters" (Object)`)

			} else if (typeof f.parameters.endpoint != 'string' || await !Utils._checkUrl(f.parameters.endpoint)) {
				this._err(`Parameter <endpoint>(${f.parameters.endpoint}) must be a valid endpoint`)

			// } else if (typeof f.parameters.order != 'number' && typeof f.parameters.order != 'string') {
			// 	this._err(`Parameter <order>(${f.parameters.order}) must be an number or a string`)
			
			} else if (typeof f.run != 'function') {
				this._err(`Script must export a function "run"`)
			}
		}

		// Need refect for support to state with param and without, (when callback can without)
		//
		// } else if (typeof m.parameters.outputDir != 'string' 
		// || !(await fs.statSync(m.parameters.outputDir)).isDirectory()) {
		// 	throw this._err(`Parameter <outputDir>(${m.parameters.outputDir}) must be a valid directory path`)

		return task
	}
}

class Utils
{
	constructor()
	{
		throw 'cant be instantie directory'
	}

	static async _merge(data, patch)
	{
		data = Object.keys(data).length > 0 ? data : new (patch.constructor)()

		if (data.constructor !== patch.constructor) {
			throw new Error(`Invalid patch Constructor (${typeof patch.constructor})`)
		}
		
		switch(patch.constructor)
		{
			case Array  : data = [].concat(data, patch); break
			case Object : data = Utils._deepAssign(data, patch); break
		}

		return data
	}

	static _deepAssign(target, source)
	{
		for (const k of Object.keys(source)) 
		{
			if (source[k] instanceof Object && k in target) {
				Object.assign(source[k], Utils._deepAssign(target[k], source[k]))
			}
		}
		Object.assign(target || {}, source)
		return target
	}

	static _walkObj(obj, keys)
	{
		let i = 0
		while(obj)
		{
			obj = Object.keys(obj).includes(keys[i]) ? obj[keys[i]] : false
			if (i == keys.length-1) return obj
			i++
		}
	}

	static async _checkUrl(url)
	{
		try { return Boolean(new URL(url)) } catch(e) { return false }
	}

	static _err(e, code = false)
	{ 
		const color = "\x1b[31m"
		const head = code ? `[ERROR] #${code}` : `[ERROR]`
		throw new Error(`${color}${head}\n> ${e}\n`)
	}
}

class Monitor
{

	// if (e instanceof EvalError)  {

	// }
}

export { Abstract, defaultOptions, Task, TasksManager, Utils, Monitor }
