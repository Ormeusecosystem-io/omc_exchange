#Patches V1.2.0



## Nav-Fix Patch

Function: Updates Dot Navigation and Page Hash functions to increase preciseness. Dot Nav is also update to increase versatility*. Page Hash updates fix possible smooth scroll jumpiness on modern browsers.

File Directory:
Patches / V1.2.0 / NAVFIX_DotNav-Hash-SmoothScroll

Installation Directions:
1. Firstly, take note of two things
* Which template you are using (Standard, Advanced, Retail)
* The directory you keep Widgets in
2. In terminal, navigate to your template directory.
3. Run this command, replacing WIDGETS-DIRECTORY with the path to your widgets directory and also replacing TEMPLATE-NAME with the name of your template style  (Standard, Advanced, Retail)

git apply --reject --whitespace=fix WIDGETS-DIRECTORY/V1.2.0/NAVFIX_DotNav-Hash-SmoothScroll/TEMPLATE-NAME/*.patch

Nav-Fix Patch should now be installed.

*Adding additional styles to the dot-nav: (Patch must be run first)
1. Navigate to: js > script.js
2. Navigate in document to dot-nav function > variables > styles object
3. Using the existing syntax, create your own object with these properties
    * color_border = Color = the border around the dot-nav
    * color_hoverText = Color = the text that appears on hover on dot-nav
    * nav_background = Color = the background color of the page-top navigation
    * nav_borderBottom = Color = the color of the border on the bottom of the page-top navigation
    * color_h1 = Color = the color of the h1 on the page-top navigation
4. Navigate to: index.html
5. Navigate to section(s) element
6. Add attributes with this format: data-dot-nav-style=“CUSTOM-STYLE-NAME”



## Ticker Patch

Function: Updates the ticker to include more data, endless and responsive scrolling, interactivity.
Notes: The updated ticker requires running patches on any template you are using as well as widgets.

File Directory:
Patches / V1.2.0 / TickerUpdate

Installation Directions Part 1 (TEMPLATE):
1. Firstly, take note of two things
	* Which template you are using (Standard, Advanced, Retail)
    * The directory you keep Widgets in
2. In terminal, navigate to your template directory.
3. run this command, replacing WIDGETS-DIRECTORY with the path to your widgets directory and also replacing TEMPLATE-NAME with the name of your template style  (Standard, Advanced, Retail)

git apply --reject --whitespace=fix WIDGETS-DIRECTORY/V1.2.0/TickerUpdate/TEMPLATE-NAME/*.patch

Ticker Patch Part 1 should now be installed. Continue To Part Two

Installation Directions Part 1 (WIDGETS):
1. Firstly, take note of the directory you keep Widgets in
2. In terminal, navigate to your Widgets directory.
3. run this command, replacing WIDGETS-DIRECTORY with the path to your widgets directory

git apply --reject --whitespace=fix WIDGETS-DIRECTORY/V1.2.0/TickerUpdate/Widgets/AFE-1387.patch

Ticker Patch Part 2should now be installed.
