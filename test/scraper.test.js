'use strict'

import {jest} from '@jest/globals'
import Path from 'path'
import fs from 'fs'

import Scraper from '../src/scraper.js'


describe.skip('Scraper', function(){

	const scraper = new Scraper()

	it('Should can load a file with relative path', async function(){
		const res = await scraper.mount('../examples/example-basic.js')
		expect(res.constructor).toBe(Scrapper)
	})

	it('Should can load a file with absolute path', async function(){
		const res = await scraper.mount(`${scraper.options.root}examples/example-basic.js`)
		expect(res.constructor).toBe(Scrapper)
	})

	it('Should can load a directory with relative path with end slash', async function(){
		const res = await scraper.mount('../examples/')
		expect(res.constructor).toBe(Array)
	})

	it('Should can load a directory with relative path without end slash', async function(){
		const res = await scraper.mount('../examples')
		expect(res.constructor).toBe(Array)
	})

	it('Should can load a directory with absolute path with end slash', async function(){
		const res = await scraper.mount(`${scraper.options.root}examples/`)
		expect(res.constructor).toBe(Array)
	})

	it('Should can load a directory with absolute path without end slash', async function(){
		const res = await scraper.mount(`${scraper.options.root}examples`)
		expect(res.constructor).toBe(Array)
	})

	it('Should can load a function', async function(){
		const res = await scraper.mount(getScriptsAsFunc(1))
		expect(res.constructor).toBe(Function)
	})

	it('Should can load an array of function', async function(){
		const res = await scraper.mount(getScriptsAsFunc(2))
		expect(res.constructor).toBe(Array)
	})

	it('Should can display correct error when attempt an invalid loading action', async function(){
		const res = await scraper.mount(false)
		expect(res.constructor).toBe(Error)
	})

})