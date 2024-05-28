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
