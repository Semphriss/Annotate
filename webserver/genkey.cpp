#include <iostream>
#include <string>
#include <sys/random.h>

int main() {
  char buffer[65];
  char *ptr = buffer;

  while (ptr != buffer + 64) {
    getrandom(ptr, 1, 0);
    char c = *ptr;
    if (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c >= '0' && c <= '9') {
      ptr++;
    }
  }
  *ptr = '\0';

  std::cout << buffer << std::flush;
  return 0;
}
