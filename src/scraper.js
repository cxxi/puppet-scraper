'use strict'

import puppeteer from 'puppeteer'
import https     from 'https'
import http      from 'http'
import fs        from 'fs'

import { Abstract, defaultOptions, Utils } from './core.js'


export default class Scraper extends Abstract
{
	constructor(options = {})
	{	
		super(defaultOptions)

		this.options._apply(options)
		this.navContext = null
		this.navInstance = null

		Object.seal(this)
		return this
	}

	getTasks(name = false)
	{
		return this.tasksManager.getTask(name)
	}

	async mount(targets)
	{
		try
		{
			for (const target of Array.isArray(targets) ? targets : [targets])
			{
				let tasks = target.constructor === String
					? await this._loadScript(target)
					: target
				
				await this.tasksManager.enqueue(
					Array.isArray(tasks) ? tasks : [tasks]
				)
			}

			return this
		}
		
		catch(e) { this._err(e) }
	}

	async scrap(options = {})
	{
		try
		{			
			this.navContext = await puppeteer.launch()
			this.navInstance = await this.navContext.newPage()

			const result = {}
			const tasks = this.getTasks()

			tasks.forEach(t => t._up())
			// console.log(tasks.state)

			// CAN MAKE AN ALTERNATE SYSTEM WITH CONCURRENCE
			for (const task of tasks)
			{
				task._up()
				// console.log(task.state)
				await this.navInstance.goto(task.endpoint)
				result[task.name] = await task.run(this.navInstance)

				task._up()
			}

			await this.navContext.close()

			return !this.options.rawResult 
				? {v: result, l: 0 }
				: result

			// for (const script of this.scripts)
			// {
			// 	const url = script.parameters.url
			// 	const response = { v: {}, l: 0, t: url, e: [] }
				
			// 	await this.navInstance.goto(url)

			// 	const scraped = script.dataTransform
			// 	? await script.dataTransform(script.run(this.navInstance))
			// 	: await script.run(this.navInstance)

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
		}
		
		catch(e) { this._err(e) }
	}

	async _getResources(response)
	{
		let links = []

		Object.values(response.v).forEach(v => {
			this.options.downloads.forEach(s => {
				let path = Utils._walkObj(v, s.split(this.options.dlSeparator))
				typeof path == 'string' ? links.push(path) : null
			})
		})

		links = links.map(link => {
			if (!link.startsWith('http://') && !link.startsWith('https://')) {
				link = new URL(link, response.t).href
				// do try catch for valid first before use to download
				// Utils._checkUrl()
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


// function * iterableObj(target) 
// {
// 	yield 'This'
// 	yield 'is'
// 	yield 'iterable.'
// }
// for (const val of iterableObj()) {
//   console.log(val);
// }
// This
// is 
// iterable.