'use strict'

import inquirer from 'inquirer'

import { defaultOptions } from './index.js'
import Core from './core.js'

// 	(CLI)
// 	config
// 	script [show,add,remove,check,run]
// process.argv.length == 4


export default class Assistant extends Core
{
	constructor(argv)
	{ 
		super(defaultOptions)

		// ? (async arg => await Scraper.scrap(arg))(process.argv.slice(2, 4))
		// : await Scraper.ui() 

		// console.log('> hello from assistant')
		// console.log('> argv: '+JSON.stringify(argv))

	}

	async getUI()
	{
		return console.log("> Cli is not implemented yet\n")
	}
}