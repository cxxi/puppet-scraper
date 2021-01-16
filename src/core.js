'use strict'

export default class Core 
{
	constructor()
	{
		this.options = {
			rawResult: false, 
			merge: false,
			sort: false,
			downloads: [],
			dlSeparator: '>',
			// transform: true,
			// callback: true
		}

		this.options._mount = o => { 
			this.options = Core._deepAssign(this.options, o) 
		}

		this.scripts = []

		// const absolutePath = import.meta.url.match(/^file:\/\/(.*puppet-scraper\/)/)[1]
	}

	async _merge(data, patch)
	{
		data = Object.keys(data).length > 0 ? data : new (patch.constructor)()

		if (data.constructor !== patch.constructor) {
			this._err(`Invalid patch Constructor (${typeof patch.constructor})`)
		}
		
		switch(patch.constructor)
		{
			case Array  : data = [].concat(data, patch); break
			case Object : data = Core._deepAssign(data, patch); break
		}

		return data
	}

	static _deepAssign(target, source)
	{
		for (const k of Object.keys(source)) 
		{
			if (source[k] instanceof Object && k in target) {
				Object.assign(source[k], Core._deepAssign(target[k], source[k]))
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

	async _checkScript(m)
	{
		// IMPLEMENTE ADVANCED ERROR

		if (typeof m.name != 'string' || m.name.length < 1) {
			// add verif camelcase
			this._err(`Script must export a constant "name" (String)`)

		}else if (typeof m.parameters != 'object') {
			this._err(`Script must export a constant "parameters" (Object)`)

		} else if (typeof m.parameters.url != 'string' || await !Core._checkUrl(m.parameters.url)) {
			this._err(`Parameter <url>(${m.parameters.url}) must be a valid url`)

		} else if (typeof m.parameters.order != 'number' && typeof m.parameters.order != 'string') {
			this._err(`Parameter <order>(${m.parameters.order}) must be an number or a string`)
		
		} else if (typeof m.run != 'function') {
			this._err(`Script must export a function "run"`)
		}

		// Need refect for support to state with param and without, (when callback can without)
		//
		// } else if (typeof m.parameters.outputDir != 'string' 
		// || !(await fs.statSync(m.parameters.outputDir)).isDirectory()) {
		// 	throw this._err(`Parameter <outputDir>(${m.parameters.outputDir}) must be a valid directory path`)

		return m
	}

	_err(e, code = false)
	{ 
		const color = "\x1b[31m"
		const head = code ? `[ERROR] #${code}` : `[ERROR]`
		throw new Error(`${color}${head}\n> ${e}\n`)
	}

}