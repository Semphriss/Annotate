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

import { pdfjsLib } from './pdfjs.mjs';
import { PdfPage } from './pdf_page.mjs';

/**
 * A PDF document.
 */
export class Pdf {
  /* pdfjs document handle */ doc;
  /* PdfDocumentPage[] */ pages = [];

  static async fromData(data) {
    const that = new Pdf();

    that.doc = await pdfjsLib.getDocument({ data: data }).promise;

    return that;
  }

  getNumPages() {
    return this.doc.numPages;
  }

  async getPage(num) {
    if (num > this.doc.numPages || num < 1) {
      throw `Attempt to get PDF page #${num} of ${this.doc.numPages}`;
    }

    if (!this.pages[num]) {
      // There's probably a race condition where a given page could be fetched
      // multiple times, but it shouldn't cause any problem.
      this.pages[num] = await PdfPage.fromPdf(this.doc, num);
    }

    return this.pages[num];
  }

  async getData() {
    return await this.doc.getData();
  }
}
