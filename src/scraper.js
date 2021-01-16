'use strict'

import puppeteer from 'puppeteer'
import https     from 'https'
import http      from 'http'
import fs        from 'fs'

import Core from './core.js'


export default class Scraper extends Core
{
	constructor()
	{	
		super()

		this.browser = null
		this.page = null

		return this
	}

	async mount(path = false)
	{
		try
		{
			if ((fs.statSync(path)).isDirectory() === (fs.statSync(path)).isFile()) {
				this._err(`Method mount received an invalid path (${path})`)

			} else if ((fs.statSync(path)).isDirectory()) {
				this.scripts = this.scripts.concat(await Promise.all(
					fs.readdirSync(path).map(async script => {
						return await import(`${path}/${script}`)
					})
				))

			} else if ((fs.statSync(path)).isFile()) {
				this.scripts = this.scripts.concat([ await import(path) ])
			}

			return this
		}
		
		catch(e) { console.error(e) }
	}

	async scrap(options = {})
	{
		try
		{
			this.options._mount(options)

			if (this.scripts.length > 1 && this.options.sort) {
				const order = m => m.parameters.order
				this.scripts.sort((a, b) => {
					if (order(a) == undefined || order(b) == undefined) {
						this._err(`Disable <sort> option or specify <order> parameter on scripts`)
					}
					return order(a) - order(b)
				})
			}
			
			this.browser = await puppeteer.launch()
			this.page = await this.browser.newPage()

			const response = {}

			for (const script of this.scripts)
			{
				await this.page.goto(script.parameters.url)
				response[script.name] = await script.run(this.page)
			}

			await this.browser.close()
			
			return response
		}
		
		catch(e) { console.error(e) }
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
}