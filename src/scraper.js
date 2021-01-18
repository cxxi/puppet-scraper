'use strict'

import puppeteer from 'puppeteer'
import https     from 'https'
import http      from 'http'
import Readline  from 'readline'

import { Abstract, defaultOptions, Monitor, Utils } from './core.js'


export default class Scraper extends Abstract
{
	constructor(options = {})
	{	
		super(defaultOptions)
		this._initialization(options)

		this.navContext = null
		this.navInstance = null

		Object.seal(this)
		Monitor.out(`> [Scraper] Hello from Scraper !`, 2)

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

	async enqueue(targets)
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

			this._initRun()
			await this._execRun()
			await this.navContext.close()

			return await this.getResult()
		}
		
		catch(e) { this._err(e) }
	}

	_initRun()
	{
		const tasks = this.getTasks()

		Monitor.out(1)
		Monitor.out(`> [Scraper] Going run the tasks in queue...`, 1)
		Monitor.out(`> [Scraper] Options: `)
		console.log(this.options)
		Monitor.out(1)
		
		tasks.forEach(task => Monitor.taskProcess(task, true))

		const rl = Readline.createInterface({ input: process.stdin, output: process.stdout })
		Readline.moveCursor(process.stdout, 0, (rl.getCursorPos()).rows-tasks.length)
	}

	async _execRun()
	{
		const tasks = this.getTasks()

		for (const task of tasks)
		{
			Monitor.taskProcess(task)
			Readline.cursorTo(process.stdout, 0)

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

			Monitor.taskProcess(task, true)

			if (task.callback) task.callback(result)
		}
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