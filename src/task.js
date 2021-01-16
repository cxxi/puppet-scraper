'use strict'

import Core from './core.js'
import Utils from './utils.js'


export default class Task
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