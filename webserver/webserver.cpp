#include <csignal>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>
#include <unordered_map>

#include <arpa/inet.h>
#include <error.h>
#include <netdb.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <string.h>
#include <unistd.h>

#define HUB_PATH "/.cache/annotate.semphris/HubIncoming/"
#define LOCAL_PATH "/.local/share/annotate.semphris/pdf_documents/"

typedef enum {
  REQ_METHOD,
  REQ_URL,
  REQ_HTTPVER,
  REQ_HEADER,
  REQ_BODY,
  REQ_DONE
} ReqParseStep;

struct HTTPRequest
{
  std::string method;
  std::string url;
  std::string http_version;
  std::unordered_map<std::string, std::string> headers;
  std::string body;
  size_t total_body_length = 0;

  std::unordered_map<std::string, std::string> query;

  std::string buf;
  size_t pos = 0;
  ReqParseStep step = REQ_METHOD;
};

static const char *b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
std::string SCRIPT_base64(std::string in)
{
  std::string out;
  for (size_t i = 0; i < in.size(); i += 3) {
    char in_1 = in[i],
         in_2 = (i + 1 < in.size()) ? in[i + 1] : '\0',
         in_3 = (i + 2 < in.size()) ? in[i + 2] : '\0';
    char out_1 = (in_1 & 07770) >> 2,
         out_2 = (in_1 & 00007) << 4 | (in_2 & 07700) >> 4,
         out_3 = (in_2 & 00077) << 2 | (in_3 & 07000) >> 6,
         out_4 = (in_3 & 00777);

    out += std::string(1, b64[out_1]);
    out += std::string(1, b64[out_2]);
    out += std::string(1, (i + 1 < in.size()) ? b64[out_3] : '=');
    out += std::string(1, (i + 2 < in.size()) ? b64[out_4] : '=');
  }
  return out;
}

std::string HOME(const std::string& s)
{
  std::string home = getenv("HOME");
  return home + s;
}
/*
void SCRIPT_clear_incoming()
{
  const std::string path = HOME(HUB_PATH);
  for (const auto& dir : std::filesystem::recursive_directory_iterator(path)) {
    if (std::filesystem::is_regular_file(dir)) {
      std::string filename = dir.path().filename();
      std::regex reg{"[^a-zA-Z0-9_-]+"};
      std::string cleanname = std::regex_replace(filename, reg, "_");

      size_t n = -1;
      while (std::filesystem::exists({ HOME(LOCAL_PATH) + ((n < 0) ? "" : std::to_string(n)) })) {
        n++;
      }

      if (n >= 0) {
        cleanname += std::to_string(n);
      }

      std::ifstream in{dir.path().string()};
      std::ofstream out{HOME(LOCAL_PATH) + cleanname};
      std::string in_contents(std::istreambuf_iterator<char>(in), {});

      out << SCRIPT_base64(in_contents) << std::flush;
      std::filesystem::remove(dir.path());
    }
  }
}
*/
static std::unordered_map<std::string, std::string> g_static_files;
static std::unordered_map<std::string, std::string(*)(const HTTPRequest&)> g_scripts = {
  { "/cgi-bin/list.sh", [] (const HTTPRequest& req) -> std::string {
    if (!req.query.contains("key") || req.query.at("key") != getenv("ANNOTATE_KEY")) {
      return "HTTP/1.1 403 Forbidden\r\n\r\n";
    }

    // SCRIPT_clear_incoming();

    std::string list;

    const std::string path = HOME(LOCAL_PATH);
    for (const auto& dir : std::filesystem::recursive_directory_iterator(path)) {
      if (std::filesystem::is_regular_file(dir)) {
        list += dir.path().filename();
        list += "\n";
      }
    }

    std::stringstream res;
    res << "HTTP/1.1 200 OK\r\n"
        << "Content-Type: text/plain\r\n"
        << "Content-Length: " << list.size() << "\r\n"
        << "\r\n" << list;
    return res.str();
  }},
  { "/cgi-bin/delete.sh", [] (const HTTPRequest& req) -> std::string {
    if (!req.query.contains("key") || req.query.at("key") != getenv("ANNOTATE_KEY")) {
      return "HTTP/1.1 403 Forbidden\r\n\r\n";
    }

    if (!req.query.contains("file")) {
      return "HTTP/1.1 400 Bad request\r\n\r\n";
    }

    const std::string path = HOME(LOCAL_PATH) + req.query.at("file");
    std::filesystem::remove({path});

    return "HTTP/1.1 200 OK\r\n\r\n";
  }},
  { "/cgi-bin/get.sh", [] (const HTTPRequest& req) -> std::string {
    if (!req.query.contains("key") || req.query.at("key") != getenv("ANNOTATE_KEY")) {
      return "HTTP/1.1 403 Forbidden\r\n\r\n";
    }

    if (!req.query.contains("file")) {
      return "HTTP/1.1 400 Bad request\r\n\r\n";
    }

    const std::string path = HOME(LOCAL_PATH) + req.query.at("file");

    std::ifstream in{path};
    std::string in_contents(std::istreambuf_iterator<char>(in), {});

    std::stringstream res;
    res << "HTTP/1.1 200 OK\r\n"
        << "Content-Type: text/plain\r\n"
        << "Content-Length: " << in_contents.size() << "\r\n"
        << "\r\n" << in_contents;
    return res.str();
  }},
  { "/cgi-bin/rename.sh", [] (const HTTPRequest& req) -> std::string {
    if (!req.query.contains("key") || req.query.at("key") != getenv("ANNOTATE_KEY")) {
      return "HTTP/1.1 403 Forbidden\r\n\r\n";
    }

    if (!req.query.contains("file") || !req.query.contains("newname")) {
      return "HTTP/1.1 400 Bad request\r\n\r\n";
    }

    const std::string path = HOME(LOCAL_PATH) + req.query.at("file");
    const std::string newpath = HOME(LOCAL_PATH) + req.query.at("newname");
    std::filesystem::rename({path}, {newpath});

    return "HTTP/1.1 200 OK\r\n\r\n";
  }},
  { "/cgi-bin/save.sh", [] (const HTTPRequest& req) -> std::string {
    if (!req.query.contains("key") || req.query.at("key") != getenv("ANNOTATE_KEY")) {
      return "HTTP/1.1 403 Forbidden\r\n\r\n";
    }

    if (!req.query.contains("file")) {
      return "HTTP/1.1 400 Bad request\r\n\r\n";
    }

    const std::string path = HOME(LOCAL_PATH) + req.query.at("file");
    std::ofstream out{path};
    out << req.body << std::flush;

    return "HTTP/1.1 200 OK\r\n\r\n";
  }},
};

void init_files()
{
  static const std::string path = "./www/";

  for (const auto& dir : std::filesystem::recursive_directory_iterator(path)) {
    if (std::filesystem::is_regular_file(dir)) {
      std::ifstream ifs{dir.path().string()};
      std::string contents(std::istreambuf_iterator<char>(ifs), {});

      g_static_files[dir.path().string().substr(5)] = contents;
    }
  }
}

bool resume_parse(HTTPRequest& req, char *buf, size_t len)
{
  req.buf += std::string{buf, len};
  bool done = false;

  while (!done) {
    switch(req.step) {
      case REQ_METHOD:
      {
        size_t pos;
        if ((pos = req.buf.find(" ")) != std::string::npos) {
          req.method = req.buf.substr(0, pos);
          req.buf = req.buf.substr(pos + 1);
          req.step = REQ_URL;
        } else {
          done = true;
        }
      }
        break;

      case REQ_URL:
      {
        size_t pos;
        if ((pos = req.buf.find(" ")) != std::string::npos) {
          req.url = req.buf.substr(0, pos);
          req.buf = req.buf.substr(pos + 1);
          req.step = REQ_HTTPVER;
        } else {
          done = true;
        }
      }
        break;

      case REQ_HTTPVER:
      {
        size_t pos;
        if ((pos = req.buf.find("\r\n")) != std::string::npos) {
          req.http_version = req.buf.substr(0, pos);
          req.buf = req.buf.substr(pos + 2);
          req.step = REQ_HEADER;
        } else {
          done = true;
        }
      }
        break;

      case REQ_HEADER:
      {
        size_t pos;
        if ((pos = req.buf.find("\r\n")) != std::string::npos) {
          if (pos == 0) {
            try {
              std::string content_length = req.headers.at("Content-Length");
              req.total_body_length = std::stoi(content_length);
              req.step = REQ_BODY;
              req.buf = req.buf.substr(2);
            } catch(const std::out_of_range&) {
              req.step = REQ_DONE;
              req.buf = req.buf.substr(2);
              return true;
            }
          } else {
            std::string header = req.buf.substr(0, pos);
            size_t pos2 = header.find(": ");
            req.headers[header.substr(0, pos2)] = header.substr(pos2 + 2);
            req.buf = req.buf.substr(pos + 2);
          }
        } else {
          done = true;
        }
      }
        break;

      case REQ_BODY:
      {
        if (req.buf.size() >= req.total_body_length) {
          req.body = req.buf.substr(0, req.total_body_length);
          req.buf = req.buf.substr(req.total_body_length);
          req.step = REQ_DONE;
          return true;
        } else {
          done = true;
        }
      }
        break;

      case REQ_DONE:
        return true;
    }
  }

  return false;
}

std::unordered_map<std::string, std::string> parse_query(std::string s) {
  std::unordered_map<std::string, std::string> query;
  std::string delimiter = "&";

  size_t pos = 0;
  std::string param;
  while ((pos = s.find("&")) != std::string::npos) {
    param = s.substr(0, pos);

    size_t pos2 = param.find("=");
    std::string param_name = param.substr(0, pos2);
    std::string param_val = param.substr(pos2 + 1);
    query[param_name] = param_val;

    s = s.substr(pos + 1);
  }

  param = s.substr(0, pos);
  size_t pos2 = param.find("=");
  std::string param_name = param.substr(0, pos2);
  std::string param_val = param.substr(pos2 + 1);
  query[param_name] = param_val;

  return query;
}

std::string get_mime(std::string filename)
{
  if (filename.ends_with(".html")) {
    return "text/html";
  } else if (filename.ends_with(".js") || filename.ends_with(".mjs")) {
    return "application/javascript";
  } else if (filename.ends_with(".svg")) {
    return "image/svg+xml";
  } else {
    return "text/plain";
  }
}

#define FAIL(msg) { \
  std::cerr << msg << ": " << strerror(errno) << "\n"; \
  return 1; \
}

int main()
{
  init_files();
  std::filesystem::create_directories(HOME(LOCAL_PATH));
  std::filesystem::create_directories(HOME(HUB_PATH));

  int sockfd, connfd;
  socklen_t len;
  struct sockaddr_in servaddr, cli;

  sockfd = socket(AF_INET, SOCK_STREAM, 0);
  if (sockfd < 0) {
    FAIL("Couldn't create socket");
  }

  bzero(&servaddr, sizeof(servaddr));

  int yes = 1;
  if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)) == -1) {
    FAIL("Couldn't set socket SO_REUSEADDR");
  }

  servaddr.sin_family = AF_INET;
  servaddr.sin_addr.s_addr = inet_addr("127.0.0.1");
  servaddr.sin_port = htons(9283);

  if (bind(sockfd, (struct sockaddr*)&servaddr, sizeof(servaddr))) {
    FAIL("Couldn't bind socket");
  }

  // Now server is ready to listen and verification
  if ((listen(sockfd, 5)) != 0) {
    FAIL("Couldn't listen");
  }

  len = sizeof(cli);

  for (;;) {
    char buffer[16384];
    ssize_t read_len;
    HTTPRequest req;

    connfd = accept(sockfd, (struct sockaddr*)&cli, &len);
    if (connfd < 0) {
      FAIL("Couldn't accept");
    }

    try {
      do {
        read_len = read(connfd, buffer, sizeof(buffer));
        if (read_len < 0) {
          FAIL("Couldn't read");
        }
      } while (!resume_parse(req, buffer, read_len));

      size_t qpos = req.url.find("?");
      std::string realname = req.url.substr(0, qpos);

      if (g_scripts.contains(realname)) {
        req.query = parse_query(req.url.substr(qpos + 1));
        const auto res = g_scripts.at(realname)(req);
        write(connfd, res.data(), res.size());
      } else if (g_static_files.contains(realname)) {
        std::string contents = g_static_files.at(realname);
        std::stringstream res;
        res << "HTTP/1.1 200 OK\r\n"
            << "Content-Type: " << get_mime(realname) << "\r\n"
            << "Content-Length: " << contents.size() << "\r\n"
            << "\r\n"
            << contents;
        std::string response = res.str();

        write(connfd, response.data(), response.size());
      } else {
        std::stringstream res;
        res << "HTTP/1.1 404 Not found\r\n\r\n";
        std::string response = res.str();
        write(connfd, response.data(), response.size());
      }
    } catch (const std::exception& e) {
      std::cerr << "Couldn't treat request: " << e.what() << std::endl;
    }

    close(connfd);
  }

  close(sockfd);

  return 0;
}
