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

import { ToolHandler } from './tool_handler.mjs';
import { StrokeElement } from './elements/stroke.mjs';

/**
 * A single page of a Document.
 */
export class DocumentPage {
  /* PdfPage? */ pdfPage = null;
  /* HTMLCanvasElement */ canvas = document.createElement('canvas');
  /* { width, height } */ baseDims = {};
  /* Element[] */ elements = [];
  /* Element? */ tempElement = null;

  static async fromSaveData(data, pdf) {
    const d = data.split('\t');

    if (d.length !== 4) {
      throw "Document page data structure wrongly sized";
    }

    const index = parseInt(d.shift());
    let doc;

    // index might be NaN in case of malformed document
    if (index >= 0) {
      doc = DocumentPage.fromPdfPage(await pdf.getPage(index));
      d.shift();
      d.shift();
    } else {
      let width = parseInt(d.shift());
      let height = parseInt(d.shift());
      doc = DocumentPage.fromEmpty({ width, height });
    }

    for (const elementData of d.shift().split(';').filter(e => e.length)) {
      if (elementData.startsWith(StrokeElement.ID + ',')) {
        doc.elements.push(StrokeElement.load(elementData));
      } else {
        throw "Unrecognised element";
      }
    }

    return doc;
  }

  static fromPdfPage(pdfPage) {
    const that = new DocumentPage();

    that.pdfPage = pdfPage;
    that.pdfPage.onRenderReady((() => { that.draw(); }));
    const viewport = that.pdfPage.getDims();
    that.baseDims.width = viewport.width;
    that.baseDims.height = viewport.height;
    that.init();

    return that;
  }

  static fromEmpty(dims = { width: 1920, height: 1080 }) {
    const that = new DocumentPage();

    that.pdfPage = null;
    that.baseDims.width = dims.width;
    that.baseDims.height = dims.height;
    that.init();

    return that;
  }

  init() {
    this.canvas.width = this.baseDims.width;
    this.canvas.height = this.baseDims.height;

    ToolHandler.bindPage(this);
  }

  /**
   * Return the size adjusted to window size (scaled).
   */
  getDims() {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  /**
   * Return the base size of the canvas (PDF document dimensions, not scaled).
   */
  getBaseDims() {
    return { width: this.baseDims.width, height: this.baseDims.height };
  }

  /**
   * Return the current X-Y scale of the canvas.
   *
   * The two numbers should be the same, or nearly the same. For scaling that
   * is not based on any particular axis (like thickness), use the X component.
   */
  getScale() {
    const dims = this.getDims();
    const base = this.getBaseDims();
    return { x: dims.width / base.width, y: dims.height / base.height };
  }

  getCanvas() {
    return this.canvas;
  }

  draw(ctx = this.canvas.getContext('2d')) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (this.pdfPage) {
      this.pdfPage.draw(ctx);
    }

    for (const element of this.elements) {
      element.draw(ctx, this);
    }

    if (this.tempElement) {
      this.tempElement.draw(ctx, this);
    }
  }

  refresh() {
    const width = this.canvas.clientWidth * window.devicePixelRatio;
    const baseDims = this.getBaseDims();

    this.canvas.width = width;
    this.canvas.height = width / baseDims.width * baseDims.height;

    if (this.pdfPage) {
      this.pdfPage.autoscale(this.canvas.width);
      // The PDF page will invoke the redraw mechanism when it'll be ready
    } else {
      this.draw();
    }
  }

  addElement(element) {
    this.elements.push(element);
  }

  setTempElement(element) {
    this.tempElement = element;
  }

  serialize() {
    var data = "";

    if (this.pdfPage) {
      data += this.pdfPage.index + "\t\t\t";
    } else {
      data += `-1\t${this.baseDims.width}\t${this.baseDims.height}\t`;
    }

    for (const elem of this.elements) {
      data += elem.save() + ';';
    }

    return data;
  }
}
