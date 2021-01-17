'use strict'

import puppeteer from 'puppeteer'
import https     from 'https'
import http      from 'http'

import { Abstract, defaultOptions, Utils } from './core.js'


export default class Scraper extends Abstract
{
	constructor(options = {})
	{	
		super(defaultOptions)
		this._initialization(options)

		this.navContext = null
		this.navInstance = null

		Object.seal(this)

		return this
	}

	getTasks(name = false)
	{
		return this.tasksManager.getTask(name)
	}

	getResult(name = false)
	{
		return this.tasksManager.getResult(name)
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

			for (const task of tasks)
			{
				task._up()

				let timeleft = Date.now()
				await this.navInstance.goto(task.endpoint)
				let data = await task.run(this.navInstance)

				let downloads = task.parameters.downloads
				if (Array.isArray(downloads) && downloads.length > 0) {
					task.result.files = await this._getResources(task, data)
				}

				task.result = Object.assign({}, task.result, {
					length: (Array.isArray(data) ? data : Object.keys(data)).length,
					timeleft: `${(Date.now()-timeleft)/1000}s`,
					Milileft: Date.now()-timeleft,
					data: data
				})

				task._up()
			}

			await this.navContext.close()
			// 	if (task.callback) task.callback(result)
			return await this.getResult()
			// return await Utils.writeFile(`test.json`, response)
		}
		
		catch(e) { this._err(e) }
	}

	async _getResources(task, data)
	{
		const resources = []
		const links = []

		if (task.parameters.outputDir.constructor !== String) {
			throw `Task parameter <outputDir> must be a String` 
			// finaly if have not parameter outputDir can return base64 ?
		}

		if (task.parameters.downloads.constructor !== Array) {
			throw `Task parameter <downloads> must be an Array of String` 
			// finaly it's can be equal to true 
			// (for key to download at root of object)
		}

		Object.values(data).forEach(v => {
			task.parameters.downloads.forEach(s => {
				let path = Utils.walkObj(v, s.split(this.options.dlSeparator))
				typeof path == 'string' ? links.push(path) : null
			})
		})
		
		for (let link of [...new Set(links)])
		{
			let url = !link.startsWith('http://') && !link.startsWith('https://')
				? await Utils.checkUrl(new URL(link, task.endpoint).href, true)
				: await Utils.checkUrl(new URL(link).href, true)
			
			let filename = task.parameters.outputDir + new URL(url).pathname
			let file = await Utils.streamSetup(filename)

			resources.push(filename)
			
			switch(new URL(url).protocol)
			{
				case 'https:': {
					https.get(url, response => {
					    response.pipe(file)
					    file.on('finish', _ => file.close())
					}); break
				}

				case 'http:': {
					http.get(url, response => {
					    response.pipe(file)
					    file.on('finish', _ => file.close())
					}); break
				}
			}
		}

		return resources
	}
}