'use strict'

import inquirer from 'inquirer'

import { Abstract, defaultOptions } from './core.js'

// (CLI)
// config
// script [show,add,remove,check,run]
// process.argv.length == 4


export default class Assistant extends Abstract
{
	constructor()
	{
		super(defaultOptions)

		// ? (async arg => await Scraper.scrap(arg))(process.argv.slice(2, 4))
		// : await Scraper.ui() 

		// console.log('> hello from assistant')
		// console.log('> argv: '+JSON.stringify(argv))
	}

	async ask_context()
	{
		const choicesMenu = [
			'Configure Options',
			'Manage Tasks',
			'Run Scraper',
			'Show Logs',
			new inquirer.Separator(),
			'Exit'
		]
		return (await inquirer.prompt([{
			name: 'action',
			message: "What do you want to do today ?",
			type: 'list',
			choices: choicesMenu,
			filter: answers => {
				switch(answers)
				{
					case 'Configure Options' : return 'option'
					case 'Manage Tasks'      : return 'task'
					case 'Run Scraper'       : return 'run'
					case 'Show Logs'         : return 'log'
					default: return 'end'
				}
			}
		}])).action
	}
	async ask_optionUI()
	{
		// cli must persist options session ?
		const choicesMenu = [
			{
	          name: 'rawResult',
	          checked: this.options.rawResult,
	        },
				{
	          name: 'quiet',
	          checked: this.options.quiet,
	        },
				{
	          name: 'merge',
	          checked: this.options.merge,
	        },
				{
	          name: 'sort',
	          checked: this.options.sort,
	        },
			{
	          name: 'debug',
	          checked: this.options.debug,
	        }
		]

		return (await inquirer.prompt([{
			name: 'action',
			message: "What do you want to do today ?",
			type: 'checkbox',
			choices: choicesMenu//,
			// filter: answers => {
			// 	switch(answers)
			// 	{
			// 		case 'Configure Options' : return 'option'
			// 		case 'Manage Tasks'      : return 'task'
			// 		case 'Run Scraper'       : return 'run'
			// 		case 'Show Logs'         : return 'log'
			// 		default: return 'end'
			// 	}
			// }
		}])).action
	}

	prevent(args)
	{
		return args
	}

	_preventContext()
	{

	}

	_preventUI()
	{

	}
}