'use strict'

import puppeteer from 'puppeteer'
import Readline  from 'readline'
import https     from 'https'
import http      from 'http'

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
		Monitor.out(`> ${Monitor.n} \x1b[36mSay\x1b[0m Hello !`, 2)

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
		Monitor.runContext(this.options)
		Monitor.out(`> ${Monitor.n} \x1b[36mRun\x1b[0m`, 1)
		
		const tasks = this.getTasks()
		tasks.forEach(task => Monitor.taskProcess(task, true))

		const rl = Readline.createInterface({ input: process.stdin, output: process.stdout })
		Readline.moveCursor(process.stdout, 0, (rl.getCursorPos()).rows-tasks.length)
	}

	async _execRun()
	{
		for (let task of this.getTasks())
		{
			Monitor.taskProcess(task)

			let timeleft = task.startsTime = Date.now()

			let execTimer = setInterval( _ => {
				Readline.cursorTo(process.stdout, 0)
				Monitor.taskRuntime(task, Date.now()-timeleft)
			}, 100)
				
			Readline.cursorTo(process.stdout, 0)

			await this.navInstance.goto(task.endpoint)
			let data = await task.run(this.navInstance)
			let downloads = task.parameters.downloads
			if (Array.isArray(downloads) && downloads.length > 0) {
				task.result.files = await this._getResources(task, data)
			}

			timeleft = Date.now()-timeleft
			clearInterval(execTimer)
			Readline.cursorTo(process.stdout, 0)

			task.result = Object.assign({}, task.result, {
				length: (Array.isArray(data) ? data : Object.keys(data)).length,
				timeleft: timeleft,
				data: data
			})

			Monitor.taskProcess(task, true)

			if (task.callback) task.callback(result)
		}
	}


	async _getResources(task, data)
	{
		const links = []
		const resources = []

		if (task.parameters.downloads.constructor !== Array) {
			throw `Task parameter <downloads> must be an Array of String` 
		}

		Object.values(data).forEach(v => {
			task.parameters.downloads.forEach(s => {
				let path = Utils.walkObj(v, s.split(this.options._dlSeparator))
				typeof path == 'string' ? links.push(path) : null
			})
		})

		for (let link of [...new Set(links)])
		{
			let url = !link.startsWith('http://') && !link.startsWith('https://')
				? await Utils.checkUrl(new URL(link, task.endpoint).href, true)
				: await Utils.checkUrl(new URL(link).href, true)
			
			// If have not parameter outputDir maybe can return base64 ?
			let outputDir = this.options.outputDir
				? this.options.outputDir
				: task.parameters.outputDir

			let filename = outputDir + new URL(url).pathname
			let file = await Utils.streamSetup(filename)

			resources.push(filename)
			
			switch(new URL(url).protocol)
			{
				case 'https:': {
					// await https.get(url, response => {
					//     response.pipe(file)
					//     file.on('finish', _ => file.close())
					// }); break
					const request = await https.get(url, response => response.pipe(file))
					break
				}

				case 'http:': {
					// await http.get(url, response => {
					//     response.pipe(file)
					//     file.on('finish', _ => file.close())
					// }); break
					const request = await http.get(url, response => response.pipe(file))
					break
				}
			}
		}

		return resources
	}
}