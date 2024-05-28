/**
 * Ensure a given task is executed only once at a time by queuing a rerun.
 */
export class Job {
  cb;
  task;
  isRunning = false;
  needsRerun = false;

  constructor(task, cb) {
    this.cb = cb;
    this.task = task;
  }

  // Can't await it - if it needs rerun, it'll return immediately
  async run() {
    if (this.isRunning) {
      this.needsRerun = true;
      return;
    }

    this.isRunning = true;

    const val = await this.task();

    if (this.cb) {
      await this.cb(this.needsRerun, val);
    }

    // After invoking the callbacks, in case one of them reruns the job
    this.isRunning = false;

    if (this.needsRerun) {
      this.needsRerun = false;
      await this.run();
    }
  }
}

/**
 * Ensure a given task is executed not too often by delaying the task.
 */
export class DelayJob {
  task;
  delay;
  currentTimeout = 0;

  constructor(task, delay = 1000) {
    this.task = task;
    this.delay = delay;
  }

  run() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
    }

    this.currentTimeout = setTimeout(this.task, this.delay);
  }
}
