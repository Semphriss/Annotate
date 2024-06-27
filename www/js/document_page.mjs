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
  /* index */ index = -1;
  /* HTMLCanvasElement */ canvas = document.createElement('canvas');
  /* { width, height } */ baseDims = {};
  /* Element[] */ elements = [];
  /* Element? */ tempElement = null;

  /**
   * Load a document page from save data.
   */
  static fromSaveData(data, pdf, container) {
    const d = data.split('\t');

    if (d.length !== 4) {
      throw "Document page data structure wrongly sized";
    }

    const index = parseInt(d.shift());
    let doc;

    // index might be NaN in case of malformed document
    if (index >= 0) {
      doc = DocumentPage.fromPdfPage(pdf, index, container);
      d.shift();
      d.shift();
    } else {
      let width = parseInt(d.shift());
      let height = parseInt(d.shift());
      doc = DocumentPage.fromEmpty(container, { width, height });
    }

    for (const elementData of d.shift().split(';').filter(e => e.length)) {
      if (elementData.startsWith(StrokeElement.ID + ',')) {
        doc.elements.push(StrokeElement.load(elementData));
      } else {
        throw "Unrecognised element";
      }
    }

    if (index < 0)
      doc.draw();

    return doc;
  }

  /**
   * Create a Document page from a page in a PDF file.
   */
  static fromPdfPage(pdf, index, container) {
    const that = new DocumentPage();

    container.appendChild(that.canvas);

    // Temporary default values (before the PDF page data is fetched)
    that.baseDims.width = 1920;
    that.baseDims.height = 1080;
    that.adjustSize();

    that.index = index;

    // Function not async so that the caller can get a valid DocumentPage
    // without waiting for it to load
    (async () => {
      that.pdfPage = await pdf.getPage(index);

      const viewport = that.pdfPage.getBaseDims();
      that.baseDims.width = viewport.width;
      that.baseDims.height = viewport.height;

      that.pdfPage.onRenderReady((() => {
        that.draw();
      }));

      that.refresh();
    })();

    ToolHandler.bindPage(that);

    return that;
  }

  /**
   * Create a new, empty Document page.
   */
  static fromEmpty(container, dims = { width: 1920, height: 1080 }) {
    const that = new DocumentPage();

    container.appendChild(that.canvas);

    that.pdfPage = null;
    that.baseDims.width = dims.width;
    that.baseDims.height = dims.height;
    that.adjustSize();

    ToolHandler.bindPage(that);

    return that;
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

  /**
   * Draw the current page on its canvas or, optionally, using a different ctx
   * supplied in parameter.
   */
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

  /**
   * Resize the canvas dimensions to fit the page. This function does not
   * invoke any redrawing mechanism; usage of refresh() is preferred.
   */
  adjustSize() {
    const width = this.canvas.clientWidth * window.devicePixelRatio;
    const baseDims = this.getBaseDims();

    this.canvas.width = width;
    this.canvas.height = width / baseDims.width * baseDims.height;
  }

  /**
   * Resize the canvas dimensions to fit the page, and redraws the page with
   * the new dimensions.
   */
  refresh() {
    this.adjustSize();

    if (this.pdfPage) {
      this.pdfPage.autoscale(this.canvas.width);
      // The PDF page will invoke the redraw mechanism when it'll be ready
    } else {
      this.draw();
    }
  }

  /**
   * Add the given element to the page.
   */
  addElement(element) {
    this.elements.push(element);
  }

  /**
   * Put an element on the page, but don't serialize it on save/export. There
   * can be at most one temporary element. It is meant to be used by tools.
   */
  setTempElement(element) {
    this.tempElement = element;
  }

  /**
   * Return the current temporary element.
   */
  getTempElement() {
    return this.tempElement;
  }

  /**
   * Convert the data in this page into a string that can be passed to
   * fromSaveData().
   */
  serialize() {
    var data = "";

    if (this.index >= 0) {
      data += this.index + "\t\t\t";
    } else {
      data += `-1\t${this.baseDims.width}\t${this.baseDims.height}\t`;
    }

    for (const elem of this.elements) {
      data += elem.save() + ';';
    }

    return data;
  }

  /**
   * Adds the corrent page to the PDF-LIB document.
   */
  async exportPdf(pdf, originalPdf) {
    let currPage;

    if (this.index >= 0 && originalPdf) {
      const [copy] = await pdf.copyPages(originalPdf, [this.index - 1]);
      currPage = pdf.addPage(copy);
    } else {
      const dims = this.getBaseDims();
      currPage = pdf.addPage([ dims.width, dims.height ]);
    }

    for (const elem of this.elements) {
      await elem.exportPdf(currPage);
    }
  }
}
