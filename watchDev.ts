import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let changeDetected = false;
let commandRunning = false;

// Function to execute a command
const executeCommand = async (command: string): Promise<void> => {
	const commandStartTime = new Date().getTime();
	try {
		const { stdout, stderr } = await execPromise(command);
		console.log(stdout);
		if (stderr) {
			console.error(stderr);
			// run once more if errors, just in case.
			await execPromise(command);
			console.log(stdout);
			if (stderr) {
				console.error(stderr);
			}
		}
	} catch (error) {
		console.error('Error executing command:', error);
	}
	const commandEndTime = new Date().getTime();
	console.log(`TypeScript + Build took ${commandEndTime - commandStartTime}ms total.`);
};

const handleChange = async (): Promise<void> => {
	changeDetected = true;
	if (commandRunning) {
		return;
	}

	if (changeDetected) {
		commandRunning = true;
		changeDetected = false;

		await executeCommand('npm run dev');

		commandRunning = false;
		if (changeDetected) {
			setTimeout(handleChange, 0);
		} else {
			console.log(`Waiting on new changes.`);
		}
	}
};

const watcher = chokidar.watch('src/**/*.*', {
	ignored: /node_modules/,
	persistent: true,
	ignoreInitial: true,
	usePolling: true,
	interval: 100,
	binaryInterval: 300
});

watcher.on('all', (event, path) => {
	if (path.includes('.tsbuildinfo')) {
		return;
	}
	console.log(`File ${path} ${event}`);
	setTimeout(handleChange, 0);
});
