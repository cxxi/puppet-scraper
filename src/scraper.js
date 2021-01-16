'use strict'

import puppeteer from 'puppeteer'
import https     from 'https'
import http      from 'http'
import fs        from 'fs'

import { defaultOptions } from './index.js'
import Core from './core.js'
import Utils from './utils.js'


export default class Scraper extends Core
{
	constructor(options = {})
	{	
		super(defaultOptions)

		this.opt._apply(options)
		this.navContext = null
		this.navInstance = null

		return this
	}

	async mount(targets)
	{
		try
		{
			const tasks = []

			for (const t of Array.isArray(targets) ? targets : [targets])
			{
				let s = t.constructor === String
					? await this._load_task(t)
					: t

				tasks.push(await this._check_task(s))
			}

			this.tasks = tasks.flat()
			return this
		}
		
		catch(e) { console.error(e) }
	}

	async scrap(options = {})
	{
		try
		{			
			this.navContext = await puppeteer.launch()
			this.navInstance = await this.navContext.newPage()

			const result = {}

			if (this.opt.sort) this._sort_tasks()

			for (const task of this.tasks)
			{
				await this.navInstance.goto(task.parameters.url)
				result[task.name] = await task.run(this.navInstance)
			}

			await this.navContext.close()

			return !this.opt.rawResult 
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

			// 	if (this.opt.merge) {

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

			// if (this.opt.downloads.length > 0) {
			// 	await this._getResources(response)
			// }
		}
		
		catch(e) { console.error(e) }
	}

	async _getResources(response)
	{
		let links = []

		Object.values(response.v).forEach(v => {
			this.opt.downloads.forEach(s => {
				let path = Utils._walkObj(v, s.split(this.opt.dlSeparator))
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