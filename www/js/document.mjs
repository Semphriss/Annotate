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

import { DocumentPage } from './document_page.mjs';
import { Pdf } from './pdf.mjs';
import { Job } from './job.mjs';
import { saveFile } from './file_manager.mjs';
import { Uint8ArrayToBase64 } from './b64.mjs';
import { PDFDocument } from '../pdf-lib.esm.min.js';

/**
 * A document, as managed by Annotate.
 */
export class Document {
  /* PdfDocument? */ pdf;
  /* DocumentPage[] */ pages = [];
  /* HTMLElement */ container;
  /* string */ name;
  /* ChainedJob */ saveJob = new Job(this.saveImp.bind(this),
                                     this.notifyOnSaved.bind(this));
  /* function[] */ saveCbs = [];

  /**
   * Loads a previously saved Annotate document.
   */
  static async fromSaveData(data, container, name) {
    const that = new Document();

    const dataPages = data.split('\n');
    const pdfData = dataPages.shift();

    if (pdfData.length !== 0) {
      that.pdf = await Pdf.fromData(pdfData);
    }

    that.container = container;
    that.name = name;

    // Special case: freshly imported files have no pages; generate them
    if (dataPages.filter(p => p.length !== 0).length === 0 && that.pdf) {
      for (let i = 1; i <= that.pdf.getNumPages(); i++) {
        that.addPage(DocumentPage.fromPdfPage(that.pdf, i, container));
      }
    } else {
      for (const dataPage of dataPages.filter(p => p.length !== 0)) {
        that.addPage(DocumentPage.fromSaveData(dataPage, that.pdf, container));
      }
    }

    return that;
  }

  /**
   * Creates and prefills a new Annotate document from PDF data.
   */
  static async fromPdfData(data, container, name) {
    const that = new Document();

    that.pdf = await Pdf.fromData(data);
    that.container = container;
    that.name = name;

    for (let i = 1; i <= that.pdf.getNumPages(); i++) {
      that.addPage(DocumentPage.fromPdfPage(that.pdf, i, container));
    }

    return that;
  }

  /**
   * Creates a new, empty Annotate document.
   */
  static fromEmpty(container, name) {
    const that = new Document();

    that.pdf = null;
    that.container = container;
    that.name = name;
    that.addPage(DocumentPage.fromEmpty(container));

    return that;
  }

  /**
   * Adds a page to the document at the specified position.
   */
  addPage(page, position = -1) {
    if (position < 0) {
      this.pages.push(page);
    } else {
      this.pages.splice(position, 0, page);
    }
  }

  /**
   * Refreshes and re-renders all the page canvases.
   */
  refresh() {
    for (const page of this.pages) {
      page.refresh();
    }
  }

  /**
   * Save the document.
   */
  save() {
    this.saveJob.run();
  }

  /**
   * Internal function to perform the save. Please use save() instead to avoid
   * concurrent saves.
   */
  async saveImp() {
    let serialized = '';

    if (this.pdf) {
      serialized += this.pdf.getB64Data();
    }

    for (const page of this.pages) {
      serialized += '\n' + page.serialize();
    }

    await saveFile(this.name, serialized);
  }

  /**
   * Call cb each time the document is saved. The first and only parameter is
   * true if there will be another invocation soon (the document will save
   * again) and false otherwise.
   */
  onSaved(cb) {
    this.saveCbs.push(cb);
  }

  /**
   * Call the callbacks supplied by onSaved(). This function should be
   * considered private.
   */
  notifyOnSaved(needsRerun) {
    for (const cb of this.saveCbs) {
      cb(needsRerun);
    }
  }

  /**
   * Export the document to a PDF document.
   */
  async exportPdf() {
    const pdfDoc = await PDFDocument.create();
    const originalPdf = (!this.pdf) ? null
                        : await PDFDocument.load(await this.pdf.getData());

    for (const page of this.pages) {
      await page.exportPdf(pdfDoc, originalPdf);
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    return Uint8ArrayToBase64(await pdfDoc.save());
  }
}
