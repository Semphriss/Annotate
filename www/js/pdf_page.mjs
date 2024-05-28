import { Job } from './job.mjs';

/**
 * A single page of a PDF document.
 */
export class PdfPage {
  /* pdfjs page handle */ page;
  /* number */ index;
  /* HTMLCanvasElement */ canvas = document.createElement('canvas');
  /* number */ baseWidth = 0;
  /* number */ currentWidth = 0;
  /* Job */ renderJob = new Job(this.render.bind(this),
                                this.notifyRenderReady.bind(this));
  /* function[] */ cbs = [];
  /* bool */ hasRenderedOnce = false;

  static async fromPdf(pdf, index) {
    const that = new PdfPage();

    that.page = await pdf.getPage(index);
    that.index = index;
    that.baseWidth = that.page.getViewport({ scale: 1 }).width;
    that.autoscale(that.baseWidth);

    return that;
  }

  async render() {
    const id = Math.random();

    const scale = this.currentWidth / this.baseWidth;
    const viewport = this.page.getViewport({ scale: scale * 1 });

    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;

    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    await this.page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    this.hasRenderedOnce = true;
  }

  autoscale(width) {
    this.currentWidth = width;
    this.renderJob.run();
  }

  draw(ctx) {
    if (!this.hasRenderedOnce)
      return;

    const dims = this.getDims();
    ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  getDims() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  onRenderReady(cb) {
    this.cbs.push(cb);
  }

  notifyRenderReady(needsRerun) {
    for (const cb of this.cbs) {
      cb(needsRerun);
    }
  }
}
