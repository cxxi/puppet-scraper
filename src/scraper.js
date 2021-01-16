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

	async mount(script = false)
	{
		try
		{
			if (typeof script === 'string') {

				if (!script.startsWith('/')) {
					this._err(`Invalid path, should be absolute (${script})`)

				} else if ((fs.statSync(script)).isDirectory() === (fs.statSync(script)).isFile()) {
					this._err(`Method mount received an invalid path (${script})`)

				} else if ((fs.statSync(script)).isDirectory()) {
					this.scripts = this.scripts.concat(await Promise.all(
						fs.readdirSync(script).map(async s => await import(`${script}/${s}`))
					))

				} else if ((fs.statSync(script)).isFile()) {
					this.scripts = this.scripts.concat([ await import(script) ])
				}
			
			} else if (typeof script == 'object') {

				this.scripts = !Array.isArray(script)
					? this.scripts.concat([this._buildScriptModule(script)])
					: this.scripts.concat(script.map(s => this._buildScriptModule(s)))

			} else {

				this._err(`Invalid argument, should be an absolute path, a function or an array of functions.`)
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

			// for (const script of this.scripts)
			// {
			// 	const url = script.parameters.url
			// 	const response = { v: {}, l: 0, t: url, e: [] }
				
			// 	await this.page.goto(url)

			// 	const scraped = script.dataTransform
			// 	? await script.dataTransform(script.run(this.page))
			// 	: await script.run(this.page)

			// 	if (this.options.merge) {

			// 		response.v = await this._merge(response.v, scraped)

			// 		/* make calc length function */
			// 		response.l = !Array.isArray(response.v)
			// 		? Object.keys(response.v).length
			// 		: response.v.length

			// 	} else {

			// 		response.v[script.name] = scraped
			// 		if (script.callback) script.callback(scraped)

			// 		const dl = script.parameters.downloads
			// 		if (Array.isArray(dl) && dl.length > 0) {
			// 			this._getResources(response)
			// 			// check double download
			// 		}
			// 	}

			// 	// await this._persist(url, data, task.dataTransform)
			// 	// await this._write(`test.json`, response)
			// }

			// if (this.options.downloads.length > 0) {
			// 	await this._getResources(response)
			// }

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

	_buildScriptModule(scriptFunc)
	{
		// scriptFunc
	}

	async _getResources(response)
	{
		let links = []

		Object.values(response.v).forEach(v => {
			this.options.downloads.forEach(s => {
				let path = Core._walkObj(v, s.split(this.options.dlSeparator))
				typeof path == 'string' ? links.push(path) : null
			})
		})

		links = links.map(link => {
			if (!link.startsWith('http://') && !link.startsWith('https://')) {
				link = new URL(link, response.t).href
				// do try catch for valid first before use to download
				// Core._checkUrl()
			}
			return link
		})

		console.log(links)

		// let source = url.slice(0,url.length-1)+icon
		// let filename = this.path.dest+icon
		// let dir = filename.split('/').slice(0, filename.split('/').length-1).join('/')
		// await fs.existsSync(dir) || await fs.mkdirSync(dir, { recursive: true })
		// let file = fs.createWriteStream(filename)
		// https.get(source, response => {
		//     response.pipe(file); file.on('finish', _ => file.close())
		// })
		// const dataYml = await yaml.stringify(data)
		// await fs.writeFileSync(`${this.path.dest}/items.yml`, dataYml)
	}
	
	//  async _write(filename, response)
	//  {
	// 		await fs.writeFileSync(`${script.parameters.outputDir}/${filename}`, JSON.stringify(response, null, 2))
	//  }
}