#!/bin/bash

################## INQUIRER.SH ##################
# https://github.com/kahkhang/Inquirer.sh

# The MIT License (MIT)

# Copyright (c) 2017

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# store the current set options
OLD_SET=$-
set -e

arrow="$(echo -e '\xe2\x9d\xaf')"
checked="$(echo -e '\xe2\x97\x89')"
unchecked="$(echo -e '\xe2\x97\xaf')"

black="$(tput setaf 0)"
red="$(tput setaf 1)"
green="$(tput setaf 2)"
yellow="$(tput setaf 3)"
blue="$(tput setaf 4)"
magenta="$(tput setaf 5)"
cyan="$(tput setaf 6)"
white="$(tput setaf 7)"
bold="$(tput bold)"
normal="$(tput sgr0)"
dim=$'\e[2m'

print() {
  echo "$1"
  tput el
}

join() {
  local IFS=$'\n'
  local _join_list
  eval _join_list=( '"${'${1}'[@]}"' )
  local first=true
  for item in ${_join_list[@]}; do
    if [ "$first" = true ]; then
      printf "%s" "$item"
      first=false
    else
      printf "${2-, }%s" "$item"
    fi
  done
}

function gen_env_from_options() {
  local IFS=$'\n'
  local _indices
  local _env_names
  local _checkbox_selected
  eval _indices=( '"${'${1}'[@]}"' )
  eval _env_names=( '"${'${2}'[@]}"' )

  for i in $(gen_index ${#_env_names[@]}); do
    _checkbox_selected[$i]=false
  done

  for i in ${_indices[@]}; do
    _checkbox_selected[$i]=true
  done

  for i in $(gen_index ${#_env_names[@]}); do
    printf "%s=%s\n" "${_env_names[$i]}" "${_checkbox_selected[$i]}"
  done
}

on_default() {
  true;
}

on_keypress() {
  local OLD_IFS
  local IFS
  local key
  OLD_IFS=$IFS
  local on_up=${1:-on_default}
  local on_down=${2:-on_default}
  local on_space=${3:-on_default}
  local on_enter=${4:-on_default}
  local on_left=${5:-on_default}
  local on_right=${6:-on_default}
  local on_ascii=${7:-on_default}
  local on_backspace=${8:-on_default}
  _break_keypress=false
  while IFS="" read -rsn1 key; do
      case "$key" in
      $'\x1b')
          read -rsn1 key
          if [[ "$key" == "[" ]]; then
              read -rsn1 key
              case "$key" in
              'A') eval $on_up;;
              'B') eval $on_down;;
              'D') eval $on_left;;
              'C') eval $on_right;;
              esac
          fi
          ;;
      ' ') eval $on_space ' ';;
      [a-z0-9A-Z\!\#\$\&\+\,\-\.\/\;\=\?\@\[\]\^\_\{\}\~]) eval $on_ascii $key;;
      $'\x7f') eval $on_backspace $key;;
      '') eval $on_enter $key;;
      esac
      if [ $_break_keypress = true ]; then
        break
      fi
  done
  IFS=$OLD_IFS
}

gen_index() {
  local k=$1
  local l=0
  if [ $k -gt 0 ]; then
    for l in $(seq $k)
    do
       echo "$l-1" | bc
    done
  fi
}

cleanup() {
  # Reset character attributes, make cursor visible, and restore
  # previous screen contents (if possible).
  tput sgr0
  tput cnorm
  stty echo

  # Restore `set e` option to its orignal value
  if [[ $OLD_SET =~ e ]]
  then set -e
  else set +e
  fi
}

control_c() {
  cleanup
  exit $?
}

select_indices() {
  local _select_list
  local _select_indices
  local _select_selected=()
  eval _select_list=( '"${'${1}'[@]}"' )
  eval _select_indices=( '"${'${2}'[@]}"' )
  local _select_var_name=$3
  eval $_select_var_name\=\(\)
  for i in $(gen_index ${#_select_indices[@]}); do
    eval $_select_var_name\+\=\(\""${_select_list[${_select_indices[$i]}]}"\"\)
  done
}




on_checkbox_input_up() {
  remove_checkbox_instructions
  tput cub "$(tput cols)"

  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    printf " ${green}${checked}${normal} ${_checkbox_list[$_current_index]} ${normal}"
  else
    printf " ${unchecked} ${_checkbox_list[$_current_index]} ${normal}"
  fi
  tput el

  if [ $_current_index = 0 ]; then
    _current_index=$((${#_checkbox_list[@]}-1))
    tput cud $((${#_checkbox_list[@]}-1))
    tput cub "$(tput cols)"
  else
    _current_index=$((_current_index-1))

    tput cuu1
    tput cub "$(tput cols)"
    tput el
  fi

  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    printf "${cyan}${arrow}${green}${checked}${normal} ${_checkbox_list[$_current_index]} ${normal}"
  else
    printf "${cyan}${arrow}${normal}${unchecked} ${_checkbox_list[$_current_index]} ${normal}"
  fi
}

on_checkbox_input_down() {
  remove_checkbox_instructions
  tput cub "$(tput cols)"

  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    printf " ${green}${checked}${normal} ${_checkbox_list[$_current_index]} ${normal}"
  else
    printf " ${unchecked} ${_checkbox_list[$_current_index]} ${normal}"
  fi

  tput el

  if [ $_current_index = $((${#_checkbox_list[@]}-1)) ]; then
    _current_index=0
    tput cuu $((${#_checkbox_list[@]}-1))
    tput cub "$(tput cols)"
  else
    _current_index=$((_current_index+1))
    tput cud1
    tput cub "$(tput cols)"
    tput el
  fi

  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    printf "${cyan}${arrow}${green}${checked}${normal} ${_checkbox_list[$_current_index]} ${normal}"
  else
    printf "${cyan}${arrow}${normal}${unchecked} ${_checkbox_list[$_current_index]} ${normal}"
  fi
}

on_checkbox_input_enter() {
  local OLD_IFS
  OLD_IFS=$IFS
  _checkbox_selected_indices=()
  _checkbox_selected_options=()
  IFS=$'\n'

  for i in $(gen_index ${#_checkbox_list[@]}); do
    if [ "${_checkbox_selected[$i]}" = true ]; then
      _checkbox_selected_indices+=($i)
      _checkbox_selected_options+=("${_checkbox_list[$i]}")
    fi
  done

  tput cud $((${#_checkbox_list[@]}-${_current_index}))
  tput cub "$(tput cols)"

  for i in $(seq $((${#_checkbox_list[@]}+1))); do
    tput el1
    tput el
    tput cuu1
  done
  tput cub "$(tput cols)"

  tput cuf $((${#prompt}+3))
  printf "${cyan}$(join _checkbox_selected_options)${normal}"
  tput el

  tput cud1
  tput cub "$(tput cols)"
  tput el

  _break_keypress=true
  IFS=$OLD_IFS
}

on_checkbox_input_space() {
  remove_checkbox_instructions
  tput cub "$(tput cols)"
  tput el
  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    _checkbox_selected[$_current_index]=false
  else
    _checkbox_selected[$_current_index]=true
  fi

  if [ "${_checkbox_selected[$_current_index]}" = true ]; then
    printf "${cyan}${arrow}${green}${checked}${normal} ${_checkbox_list[$_current_index]} ${normal}"
  else
    printf "${cyan}${arrow}${normal}${unchecked} ${_checkbox_list[$_current_index]} ${normal}"
  fi
}

remove_checkbox_instructions() {
  if [ $_first_keystroke = true ]; then
    tput cuu $((${_current_index}+1))
    tput cub "$(tput cols)"
    tput cuf $((${#prompt}+3))
    tput el
    tput cud $((${_current_index}+1))
    _first_keystroke=false
  fi
}

# for vim movements
on_checkbox_input_ascii() {
  local key=$1
  case $key in
    "j" ) on_checkbox_input_down;;
    "k" ) on_checkbox_input_up;;
  esac
}

_checkbox_input() {
  local i
  local j
  prompt=$1
  eval _checkbox_list=( '"${'${2}'[@]}"' )
  _current_index=0
  _first_keystroke=true

  trap control_c SIGINT EXIT

  stty -echo
  tput civis

  print "${normal}${green}?${normal} ${bold}${prompt}${normal} ${dim}(Press <space> to select, <enter> to finalize)${normal}"

  for i in $(gen_index ${#_checkbox_list[@]}); do
    _checkbox_selected[$i]=false
  done

  if [ -n "$3" ]; then
    eval _selected_indices=( '"${'${3}'[@]}"' )
    for i in ${_selected_indices[@]}; do
      _checkbox_selected[$i]=true
    done
  fi

  for i in $(gen_index ${#_checkbox_list[@]}); do
    tput cub "$(tput cols)"
    if [ $i = 0 ]; then
      if [ "${_checkbox_selected[$i]}" = true ]; then
        print "${cyan}${arrow}${green}${checked}${normal} ${_checkbox_list[$i]} ${normal}"
      else
        print "${cyan}${arrow}${normal}${unchecked} ${_checkbox_list[$i]} ${normal}"
      fi
    else
      if [ "${_checkbox_selected[$i]}" = true ]; then
        print " ${green}${checked}${normal} ${_checkbox_list[$i]} ${normal}"
      else
        print " ${unchecked} ${_checkbox_list[$i]} ${normal}"
      fi
    fi
    tput el
  done

  for j in $(gen_index ${#_checkbox_list[@]}); do
    tput cuu1
  done

  on_keypress on_checkbox_input_up on_checkbox_input_down on_checkbox_input_space on_checkbox_input_enter on_default on_default on_checkbox_input_ascii
}

checkbox_input() {
  _checkbox_input "$1" "$2"
  _checkbox_input_output_var_name=$3
  select_indices _checkbox_list _checkbox_selected_indices $_checkbox_input_output_var_name

  unset _checkbox_list
  unset _break_keypress
  unset _first_keystroke
  unset _current_index
  unset _checkbox_input_output_var_name
  unset _checkbox_selected_indices
  unset _checkbox_selected_options

  cleanup
}

checkbox_input_indices() {
  _checkbox_input "$1" "$2" "$3"
  _checkbox_input_output_var_name=$3

  eval $_checkbox_input_output_var_name\=\(\)
  for i in $(gen_index ${#_checkbox_selected_indices[@]}); do
    eval $_checkbox_input_output_var_name\+\=\(${_checkbox_selected_indices[$i]}\)
  done

  unset _checkbox_list
  unset _break_keypress
  unset _first_keystroke
  unset _current_index
  unset _checkbox_input_output_var_name
  unset _checkbox_selected_indices
  unset _checkbox_selected_options

  cleanup
}




on_list_input_up() {
  remove_list_instructions
  tput cub "$(tput cols)"

  printf "  ${_list_options[$_list_selected_index]}"
  tput el

  if [ $_list_selected_index = 0 ]; then
    _list_selected_index=$((${#_list_options[@]}-1))
    tput cud $((${#_list_options[@]}-1))
    tput cub "$(tput cols)"
  else
    _list_selected_index=$((_list_selected_index-1))

    tput cuu1
    tput cub "$(tput cols)"
    tput el
  fi

  printf "${cyan}${arrow} %s ${normal}" "${_list_options[$_list_selected_index]}"
}

on_list_input_down() {
  remove_list_instructions
  tput cub "$(tput cols)"

  printf "  ${_list_options[$_list_selected_index]}"
  tput el

  if [ $_list_selected_index = $((${#_list_options[@]}-1)) ]; then
    _list_selected_index=0
    tput cuu $((${#_list_options[@]}-1))
    tput cub "$(tput cols)"
  else
    _list_selected_index=$((_list_selected_index+1))
    tput cud1
    tput cub "$(tput cols)"
    tput el
  fi
  printf "${cyan}${arrow} %s ${normal}" "${_list_options[$_list_selected_index]}"
}

on_list_input_enter_space() {
  local OLD_IFS
  OLD_IFS=$IFS
  IFS=$'\n'

  tput cud $((${#_list_options[@]}-${_list_selected_index}))
  tput cub "$(tput cols)"

  for i in $(seq $((${#_list_options[@]}+1))); do
    tput el1
    tput el
    tput cuu1
  done
  tput cub "$(tput cols)"

  tput cuf $((${#prompt}+3))
  printf "${cyan}${_list_options[$_list_selected_index]}${normal}"
  tput el

  tput cud1
  tput cub "$(tput cols)"
  tput el

  _break_keypress=true
  IFS=$OLD_IFS
}

remove_list_instructions() {
  if [ $_first_keystroke = true ]; then
    tput cuu $((${_list_selected_index}+1))
    tput cub "$(tput cols)"
    tput cuf $((${#prompt}+3))
    tput el
    tput cud $((${_list_selected_index}+1))
    _first_keystroke=false
  fi
}

_list_input() {
  local i
  local j
  prompt=$1
  eval _list_options=( '"${'${2}'[@]}"' )

  _list_selected_index=0
  _first_keystroke=true

  trap control_c SIGINT EXIT

  stty -echo
  tput civis

  print "${normal}${green}?${normal} ${bold}${prompt}${normal} ${dim}(Use arrow keys)${normal}"

  for i in $(gen_index ${#_list_options[@]}); do
    tput cub "$(tput cols)"
    if [ $i = 0 ]; then
      print "${cyan}${arrow} ${_list_options[$i]} ${normal}"
    else
      print "  ${_list_options[$i]}"
    fi
    tput el
  done

  for j in $(gen_index ${#_list_options[@]}); do
    tput cuu1
  done

  on_keypress on_list_input_up on_list_input_down on_list_input_enter_space on_list_input_enter_space

}


list_input() {
  _list_input "$1" "$2"
  local var_name=$3
  eval $var_name=\'"${_list_options[$_list_selected_index]}"\'
  unset _list_selected_index
  unset _list_options
  unset _break_keypress
  unset _first_keystroke

  cleanup
}

list_input_index() {
  _list_input "$1" "$2"
  local var_name=$3
  eval $var_name=\'"$_list_selected_index"\'
  unset _list_selected_index
  unset _list_options
  unset _break_keypress
  unset _first_keystroke

  cleanup
}




on_text_input_left() {
  remove_regex_failed
  if [ $_current_pos -gt 0 ]; then
    tput cub1
    _current_pos=$(($_current_pos-1))
  fi
}

on_text_input_right() {
  remove_regex_failed
  if [ $_current_pos -lt ${#_text_input} ]; then
    tput cuf1
    _current_pos=$(($_current_pos+1))
  fi
}

on_text_input_enter() {
  remove_regex_failed

  if [[ "$_text_input" =~ $_text_input_regex && "$(eval $_text_input_validator "$_text_input")" = true ]]; then
    tput cub "$(tput cols)"
    tput cuf $((${#_read_prompt}-19))
    printf "${cyan}${_text_input}${normal}"
    tput el
    tput cud1
    tput cub "$(tput cols)"
    tput el
    eval $var_name=\'"${_text_input}"\'
    _break_keypress=true
  else
    _text_input_regex_failed=true
    tput civis
    tput cud1
    tput cub "$(tput cols)"
    tput el
    printf "${red}>>${normal} $_text_input_regex_failed_msg"
    tput cuu1
    tput cub "$(tput cols)"
    tput cuf $((${#_read_prompt}-19))
    tput el
    _text_input=""
    _current_pos=0
    tput cnorm
  fi
}

on_text_input_ascii() {
  remove_regex_failed
  local c=$1

  if [ "$c" = '' ]; then
    c=' '
  fi

  local rest="${_text_input:$_current_pos}"
  _text_input="${_text_input:0:$_current_pos}$c$rest"
  _current_pos=$(($_current_pos+1))

  tput civis
  printf "$c$rest"
  tput el
  if [ ${#rest} -gt 0 ]; then
    tput cub ${#rest}
  fi
  tput cnorm
}

on_text_input_backspace() {
  remove_regex_failed
  if [ $_current_pos -gt 0 ]; then
    local start="${_text_input:0:$(($_current_pos-1))}"
    local rest="${_text_input:$_current_pos}"
    _current_pos=$(($_current_pos-1))
    tput cub 1
    tput el
    tput sc
    printf "$rest"
    tput rc
    _text_input="$start$rest"
  fi
}

remove_regex_failed() {
  if [ $_text_input_regex_failed = true ]; then
    _text_input_regex_failed=false
    tput sc
    tput cud1
    tput el1
    tput el
    tput rc
  fi
}

text_input_default_validator() {
  echo true;
}

text_input() {
  local prompt=$1
  local var_name=$2
  local _text_input_regex="${3:-"\.+"}"
  local _text_input_regex_failed_msg=${4:-"Input validation failed"}
  local _text_input_validator=${5:-text_input_default_validator}
  local _read_prompt_start=$'\e[32m?\e[39m\e[1m'
  local _read_prompt_end=$'\e[22m'
  local _read_prompt="$( echo "$_read_prompt_start ${prompt} $_read_prompt_end")"
  local _current_pos=0
  local _text_input_regex_failed=false
  local _text_input=""
  printf "$_read_prompt"


  trap control_c SIGINT EXIT

  stty -echo
  tput cnorm

  on_keypress on_default on_default on_text_input_ascii on_text_input_enter on_text_input_left on_text_input_right on_text_input_ascii on_text_input_backspace
  eval $var_name=\'"${_text_input}"\'

  cleanup
}

################## INQUIRER.SH ##################



arch=$(dpkg --print-architecture)
if  [[ $arch == armhf ]]; then
    releaseURL=$(curl -s "https://api.github.com/repos/UnchartedBull/OctoDash/releases/latest" | grep "browser_download_url.*armv7l.deb" | cut -d '"' -f 4)
elif [[ $arch == arm64 ]]; then
    releaseURL=$(curl -s "https://api.github.com/repos/UnchartedBull/OctoDash/releases/latest" | grep "browser_download_url.*arm64.deb" | cut -d '"' -f 4)
elif [[ $arch == amd64 ]]; then
    releaseURL=$(curl -s "https://api.github.com/repos/UnchartedBull/OctoDash/releases/latest" | grep "browser_download_url.*amd64.deb" | cut -d '"' -f 4)
fi
dependencies="libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1 libappindicator3-1 libsecret-1-0 xserver-xorg ratpoison x11-xserver-utils xinit libgtk-3-0 bc desktop-file-utils libavahi-compat-libdnssd1 libpam0g-dev libx11-dev"
IFS='/' read -ra version <<< "$releaseURL"

echo "Installing OctoDash "${version[7]}, $arch""

echo "Installing Dependencies ..."
{
  sudo apt -qq update
  sudo apt -qq install $dependencies -y
} || {
  echo ""
  echo "Couldn't install dependenices!"
  echo "Seems like there is something wrong with the package manager 'apt'"
  echo ""
  echo "If the error is similar to: 'E: Repository 'http://raspbian.raspberrypi.org/raspbian buster InRelease' changed its 'Suite' value from 'stable' to 'oldstable''"
  echo "you can run 'sudo apt update --allow-releaseinfo-change' and then execute the OctoDash installation command again"
  exit -1
}

if [ -d "$HOME/OctoPrint/venv" ]; then
    DIRECTORY="$HOME/OctoPrint/venv"
elif [ -d "$HOME/oprint" ]; then
    DIRECTORY="$HOME/oprint"
else
    echo "Neither $HOME/OctoPrint/venv nor $HOME/oprint can be found."
    echo "If your OctoPrint instance is running on a different machine just type - in the following prompt."
    text_input "Please specify OctoPrints full virtualenv path manually (no trailing slash)." DIRECTORY
fi;

if [ $DIRECTORY == "-" ]; then
    echo "Not installing any plugins for remote installation. Please make sure to have Display Layer Progress installed."
elif [ ! -d $DIRECTORY ]; then
    echo "Can't find OctoPrint Installation, please run the script again!"
    exit 1
fi;

if [ $DIRECTORY != "-" ]; then
  plugins=( 'OctoDash Companion' 'Display Layer Progress' 'Filament Manager' 'Spool Manager' 'Preheat Button' 'Enclosure' 'Print Time Genius' 'Ultimaker Format Package' 'PrusaSlicer Thumbnails' 'TPLinkSmartPlug' 'Tasmota' 'TasmotaMQTT', 'Ophom (Phillips HUE)')
  checkbox_input "Which plugins should I install (you can also install them via the Octoprint UI later)?" plugins selected_plugins
  echo "Installing Plugins..."

  if [[ " ${selected_plugins[@]} " =~ "OctoDash Companion" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-OctoDashCompanion/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Display Layer Progress" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/OllisGit/OctoPrint-DisplayLayerProgress/releases/latest/download/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Filament Manager" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/OllisGit/OctoPrint-FilamentManager/releases/latest/download/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Spool Manager" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/OllisGit/OctoPrint-SpoolManager/releases/latest/download/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Preheat Button" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/marian42/octoprint-preheat/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Enclosure" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/vitormhenrique/OctoPrint-Enclosure/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Print Time Genius" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/eyal0/OctoPrint-PrintTimeGenius/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Ultimaker Format Package" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-UltimakerFormatPackage/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "PrusaSlicer Thumbnails" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-PrusaSlicerThumbnails/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "TPLinkSmartplug" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-TPLinkSmartplug/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Tasmota" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-Tasmota/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "TasmotaMQTT" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/jneilliii/OctoPrint-TasmotaMQTT/archive/master.zip"
  fi;
  if [[ " ${selected_plugins[@]} " =~ "Ophom (Phillips HUE)" ]]; then
      "$DIRECTORY"/bin/pip install -q --disable-pip-version-check "https://github.com/Salamafet/ophom/archive/refs/heads/master.zip"
  fi;
fi;

if "$DIRECTORY"/bin/octoprint config get --yaml "api.allowCrossOrigin" | grep -q 'false'; then
yes_no=( 'yes' 'no' )

list_input "Should I enable CORS ? FYI, this is required by OctoDash v3 and OctoPrint 1.6.0, and may have security implications" yes_no cors

echo $cors
if [ $cors == 'yes' ]; then
        echo "Enabling CORS ..."
        "$DIRECTORY"/bin/octoprint config set --bool "api.allowCrossOrigin" true
else
  echo "${red}CORS has ${bold}NOT${normal} been enabled. OctoDash most likely won't work if CORS is disabled. You can always enable it in the API settings in OctoPrint"
fi
fi;

echo "Installing OctoDash "${version[7]}, $arch" ..."
cd ~
wget -O octodash.deb $releaseURL -q --show-progress

sudo dpkg -i octodash.deb

rm octodash.deb

yes_no=( 'yes' 'no' )

list_input "Should I setup OctoDash to automatically start on boot?" yes_no auto_start

echo $auto_start
if [ $auto_start == 'yes' ]; then
    echo "Setting up Autostart ..."
    cat <<EOF > ~/.xinitrc
#!/bin/sh

xset s off
xset s noblank
xset -dpms

ratpoison&
octodash
EOF

    cat <<EOF >> ~/.bashrc
if [ -z "\$SSH_CLIENT" ] || [ -z "\$SSH_TTY" ]; then
    xinit -- -nocursor
fi
EOF

    echo "Setting up Console Autologin ..."
    sudo systemctl set-default multi-user.target
    sudo ln -fs /lib/systemd/system/getty@.service /etc/systemd/system/getty.target.wants/getty@tty1.service
    sudo bash -c 'cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf' << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOF

    echo "Setting Permissions ..."
    sudo chmod +x ~/.xinitrc
    sudo chmod ug+s /usr/lib/xorg/Xorg

    echo "OctoDash will start automatically on next reboot. Please ensure that auto-login is enabled!"
fi

list_input "Should I setup the update script? This will allow installing '~/tmp/octodash.deb' without sudo or root access. For more info visit the Update section of the wiki. " yes_no update
if [ $update == 'yes' ]; then
    mkdir -p ~/scripts
    echo "Setting up update script ..."
    cat <<EOF > ~/scripts/update-octodash
#!/bin/bash

dpkg -i /tmp/octodash.deb
rm /tmp/octodash.deb
EOF

    sudo chmod +x ~/scripts/update-octodash

    sudo bash -c 'cat >> /etc/sudoers.d/update-octodash' <<EOF
pi ALL=NOPASSWD: $HOME/scripts/update-octodash
EOF
fi


list_input "Shall I reboot your Pi now?" yes_no reboot
echo "OctoDash has been successfully installed! :)"
if [ $reboot == 'yes' ]; then
    sudo reboot
fi
