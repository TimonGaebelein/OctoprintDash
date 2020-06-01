echo "Removing OctoDash ..."
sudo dpkg -P octodash

sed -i '/xset s off/d' ~/.xinitrc
sed -i '/xset s noblank/d' ~/.xinitrc
sed -i '/xset -dpms/d' ~/.xinitrc
sed -i '/ratpoison&/d' ~/.xinitrc
sed -i '/octodash/d' ~/.xinitrc

echo "OctoDash has been removed :(. Please review your ~/.xinitrc and ~/.bashrc files to make sure everything got removed properly!"
