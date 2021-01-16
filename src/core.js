'use strict'

export default class Core 
{
	constructor()
	{
		this.options = {}

		this.options._mount = o => { 
			this.options = Core._deepAssign(this.options, o) 
		}

		this.scripts = []
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

	_err(e, code = false)
	{ 
		const color = "\x1b[31m"
		const head = code ? `[ERROR] #${code}` : `[ERROR]`
		throw new Error(`${color}${head}\n> ${e}\n`)
	}

}