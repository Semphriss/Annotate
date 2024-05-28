import { DocumentPage } from './document_page.mjs';
import { Pdf } from './pdf.mjs';
import { Job } from './job.mjs';
import { saveFile } from './file_manager.mjs';

function Uint8ArrayToBase64(arr) {
  var binary = '';

  for (const byte of arr) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function Base64ToUint8Array(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

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
      that.pdf = await Pdf.fromData(Base64ToUint8Array(pdfData));
    }

    that.container = container;
    that.name = name;

    // Special case: freshly imported files have no pages; generate them
    if (dataPages.filter(p => p.length !== 0).length === 0 && that.pdf) {
      for (let i = 1; i <= that.pdf.getNumPages(); i++) {
        that.addPage(DocumentPage.fromPdfPage(await that.pdf.getPage(i)));
      }
    } else {
      for (const dataPage of dataPages.filter(p => p.length !== 0)) {
        that.addPage(await DocumentPage.fromSaveData(dataPage, that.pdf));
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
      that.addPage(DocumentPage.fromPdfPage(await that.pdf.getPage(i)));
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
    that.addPage(DocumentPage.fromEmpty());

    return that;
  }

  /**
   * Adds a page to the document at the specified position.
   */
  addPage(page, position = -1) {
    this.container.appendChild(page.getCanvas());
    page.refresh();

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
      serialized += Uint8ArrayToBase64(await this.pdf.getData());
    }

    for (const page of this.pages) {
      serialized += '\n' + page.serialize();
    }

    await saveFile(this.name, serialized);
  }

  onSaved(cb) {
    this.saveCbs.push(cb);
  }

  notifyOnSaved(needsRerun) {
    for (const cb of this.saveCbs) {
      cb(needsRerun);
    }
  }
}
