project(annotate)
cmake_minimum_required(VERSION 3.0)

set(CMAKE_CXX_STANDARD 20)

add_executable(webserver webserver/webserver.cpp)
add_executable(genkey webserver/genkey.cpp)

install(TARGETS webserver genkey DESTINATION bin)
install(DIRECTORY www assets DESTINATION .)
install(FILES annotate.apparmor
              annotate.desktop
              annotate-contenthub.json
              LICENSE
              manifest.json
              README.md
              DESTINATION .)
install(PROGRAMS run.sh DESTINATION .)

