'use strict'

import { jest } from '@jest/globals'

import { Cli, Task } from '../src/index.js'
import Core          from '../src/core.js'
import Scraper       from '../src/scraper.js'
import Assistant     from '../src/assistant.js'


describe('Check Integrity of sources', function(){

	it('Cli should return a function', function(){
		expect(Cli.constructor).toBe(Object.getPrototypeOf(async _ => {}).constructor)
	})

	it('Task should return an instance of Task class', function(){
		expect((new Task()).constructor).toBe(Task)
	})

	it('Core should return an instance of Core class', function(){
		expect((new Core()).constructor).toBe(Core)
	})

	it('Scraper should return an instance of Scraper class', function(){
		expect((new Scraper()).constructor).toBe(Scraper)
	})

	it('Assistant should return an instance of Assistant class', function(){
		expect((new Assistant()).constructor).toBe(Assistant)
	})

})