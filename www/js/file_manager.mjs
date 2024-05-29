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

const key = window.location.search.replace(/^.*key=([a-zA-Z0-9]+).*$/i, "$1");
// const files = {};

async function action(name, args, body = null) {
  let url = `/cgi-bin/${name}.sh?key=${key}`;

  for (const [k, v] of Object.entries(args)) {
    url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }

  // FIXME: The CGI server (Python) never reports when the body is fully sent,
  // resulting in a hanging connection. This is an ugly hack to work around
  // that issue.
  const controller = new AbortController();
  setTimeout(() => { controller.abort(); }, 1000); // Should be enough...?

  try
  {
    const response = await fetch(url, {
      method: (body !== null) ? 'POST' : 'GET',
      body: body,
      signal: controller.signal
    });

    return await response.text();
  } catch(e) {
    return "";
  }
}

export async function saveFile(filename, data) {
  // files[filename] = data;
  await action('save', { file: filename }, data);
}

export async function listFiles() {
  // return Object.keys(files);
  return (await action('list', { })).split('\n').filter(f => f.length);
}

export async function openFile(filename) {
  // return files[filename];
  return await action('get', { file: filename });
}

export async function deleteFile(filename) {
  // delete files[filename];
  await action('delete', { file: filename });
}

export async function renameFile(filename, newfilename) {
  // files[newfilename] = files[filename];
  // delete files[filename];
  await action('rename', { file: filename, newname: newfilename });
}
