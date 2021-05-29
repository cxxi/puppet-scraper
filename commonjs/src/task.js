'use strict'

module.exports = class Task
{
	constructor(name = false)
	{
		if (name.constructor !== String || name.length < 1) {
			throw 'Initialization failed'
		}

		this.parameters = {}
		this.callback   = false
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
				i = i === 7 ? 2 : i
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
					case 0: this.state = '-notdefined--' ;break
					case 1: this.state = '---defined---' ;break
					case 2: this.state = '----ready----' ;break
					case 3: this.state = '---pending---' ;break
					case 4: this.state = '---running---' ;break
					case 5: this.state = '-downloading-' ;break
					case 6: this.state = '----ended----' ;break
				}

				return this
			}
		})

		Object.defineProperty(this, 'countDownloads', {
			enumerable: false,
			configurable: true,
			writable: true,
			value: [0, 0]
		})

		this.run = async _ => null
		this.result = {}

		Object.seal(this)
		return this._up()
	}

	define(parameters = {}, run, callback = false)
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

		if (callback) {

			if (callback.constructor !== (async _ => {}).constructor) {
				throw 'Invalid <callback> argument, must be an Async Function'
			}

			Object.defineProperty(this, 'callback', {
				configurable: false,
				writable: false,
				value: callback
			})
		}

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