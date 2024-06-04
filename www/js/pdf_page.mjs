//  Annotate - View and annotate your PDF files
//  Copyright 2022-2024 Semphris <semphris@semphris.com>
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

import { Job } from './job.mjs';

/**
 * A single page of a PDF document.
 */
export class PdfPage {
  /* pdfjs page handle */ page;
  /* number */ index;
  /* HTMLCanvasElement */ canvas = document.createElement('canvas');
  /* number */ baseWidth = 0;
  /* number */ baseHeight = 0;
  /* number */ currentWidth = 0;
  /* Job */ renderJob = new Job(this.render.bind(this),
                                this.notifyRenderReady.bind(this));
  /* function[] */ cbs = [];
  /* bool */ hasRenderedOnce = false;

  /**
   * Create a new PdfPage with the supplied Pdf document and page index.
   */
  static async fromPdf(pdf, index) {
    const that = new PdfPage();

    that.page = await pdf.getPage(index);
    that.index = index;

    const baseDims = that.page.getViewport({ scale: 1 });
    that.baseWidth = baseDims.width;
    that.baseHeight = baseDims.height;

    return that;
  }

  /**
   * Pre-render the PDF page on a canvas, which will hold the resulting image
   * for faster redraws.
   */
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

  /**
   * Adjust the scale of the PdfPage to accomodate for the new width.
   */
  autoscale(width) {
    this.currentWidth = width;
    this.renderJob.run();
  }

  /**
   * Draw the cached PDF page on the canvas, 
   */
  draw(ctx) {
    if (!this.hasRenderedOnce)
      return;

    const dims = this.getDims();
    ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get the base dimensions of the PDF page.
   */
  getBaseDims() {
    return {
      width: this.baseWidth,
      height: this.baseHeight
    };
  }

  /**
   * Get the dimensions of the PDF page corresponding to the current scale.
   */
  getDims() {
    // If the page hasn't rendered, the canvas still has its default size
    if (!this.hasRenderedOnce)
      throw 'Attempt to getDims() on a PdfPage that hasn\'t already rendered';

    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Call cb each time the PdfPage is ready to be drawn. The first and only
   * parameter is true if there will be another invocation soon (the document
   * will save again) and false otherwise.
   */
  onRenderReady(cb) {
    this.cbs.push(cb);
  }

  /**
   * Call the callbacks supplied by onRenderReady(). This function should be
   * considered private.
   */
  notifyRenderReady(needsRerun) {
    for (const cb of this.cbs) {
      cb(needsRerun);
    }
  }
}
