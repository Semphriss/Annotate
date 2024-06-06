# Annotate

**Annotate** is a lightweight HTML5 application that lets you draw, write,
highlight and annotate your PDF files.

It uses Mozilla's [PDF.js](https://mozilla.github.io/pdf.js/) library as well
as [PDF-LIB](https://pdf-lib.js.org/) for exporting.

## Building

Annotate is built using [Clickable](https://clickable-ut.dev/en/latest/).

```sh
$ git clone https://github.com/Semphriss/Annotate
$ cd Annotate

# Phone plugged in
$ clickable

# Desktop testing
$ clickable desktop
```

## Inner workings

Annotate works in two parts: the app proper, which runs as an HTML5 webapp, and
a basic C++ HTTP server that handles file operations. There are plans to change
this to [more common stuff](https://github.com/Semphriss/Annotate/issues/1),
but I would need help

## License

Copyright (C) 2022-2024 Semphris

Licensed under the Apache Software License 2.0
