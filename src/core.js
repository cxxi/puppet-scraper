'use strict'

import fs from 'fs'


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

		this.tasks = []
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
	}

	define(func, params = {})
	{
		if (params.url === undefined || !Utils._checkUrl(params.url)) {
			throw new Error('Invalid url parameters')
		}
		this.url = params.url
		this.run = func
		this.parameters = params
		// Object.seal(this)
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
	async _load_scripts(target)
	{
		if (!target.startsWith('/')) {
			this._err(`Invalid path, should be absolute (${target})`)
		}

		if (await !fs.existsSync(target)) {
			this._err(`Method mount received an invalid path (${target})`)
		}

		if ((fs.statSync(target)).isDirectory()) {
			return await Promise.all(fs.readdirSync(target).map(async s => {
				return this._build_task(await import(`${target}/${s}`))
			}))
		} 

		if ((fs.statSync(target)).isFile()) {
			return this._build_task(await import(target))
		}
	}

	_build_task(script)
	{
		const task = new Task(script.name)
		task.define(script.run, script.parameters)
		return task
	}
		
	async _check_task(func)
	{
		for (const f of Array.isArray(func) ? func : [func])
		{
			if (typeof f.name != 'string' || f.name.length < 1) {
				// add verif uppercase + lowercase + _ + numeric
				this._err(`Script must export a constant "name" (String)`)

			}else if (typeof f.parameters != 'object') {
				this._err(`Script must export a constant "parameters" (Object)`)

			} else if (typeof f.parameters.url != 'string' || await !Utils._checkUrl(f.parameters.url)) {
				this._err(`Parameter <url>(${f.parameters.url}) must be a valid url`)

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

		return func
	}

	_list_tasks()
	{
		return this.tasks.map(t => t.name)
	}

	_sort_tasks(reverse = false)
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
}

class Utils
{
	constructor()
	{
		// can be instancied is static
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

export { Abstract, Task, TasksManager, Utils, Monitor }
