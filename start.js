const { spawn } = require('child_process')
function sleep(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}
//const Fonts  = require('cfonts')
const chalk = require('chalk')
const path = require('path')

function start() {
	let args = [path.join(__dirname, 'index.js'), ...process.argv.slice(2)]
	//console.log([process.argv[0], ...args].join('\n'))
	/*CFonts.say([process.argv[0], ...args].join(' '), {
        font: 'console',
        align: 'center',
        gradient: ['red', 'magenta']
    })*/
    sleep(2000)
    console.log(
        chalk.bold.green("[ ") +
        chalk.bold.yellow(">>") +
        chalk.bold.green(" ] ") +
        chalk.bold.blue("Mencari File Index.js")
    );
    sleep(5000)
    console.log(
        chalk.bold.green("[ ") +
        chalk.bold.yellow(">>") +
        chalk.bold.green(" ] ") +
        chalk.bold.blue("File Index.js Ditemukan")
    );
    sleep(10000)
    console.log(
        chalk.bold.green("[ ") +
        chalk.bold.yellow(">>") +
        chalk.bold.green(" ] ") +
        chalk.bold.blue("Menjalankan File Index.js")
    );
    
	let p = spawn(process.argv[0], args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })
	.on('message', data => {
		if (data == 'reset') {
			//console.log('[RECEIVED]')
		    console.log(
                chalk.bold.green("[ ") +
                chalk.bold.yellow(">>") +
                chalk.bold.green(" ] ") +
                chalk.bold.blue("Diterim.")
            );
			p.kill()
			start()
			delete p
		}
	})
	.on('exit', code => {
		//console.error('Exited with code:', code)
		    console.log(
                chalk.bold.green("[ ") +
                chalk.bold.yellow(">>") +
                chalk.bold.green(" ] ") +
                chalk.bold.blue("Alasan Terputus Dengan Kode: ") +
                code
            );
		if (code == "." || code == 1 || code == 0 || code == null) start()
	})
}
start()