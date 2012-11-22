deathstar-appliance
===================

This is the web application front-end to the Death Star virtual appliance.

The Death Star virtual appliance integrates all the tools needed for topic-based
authoring, and automates their orchestration. The purpose is to allow an author
to experience a flow state of writing, and focus on high-level tasks only, 
leaving the details to the software agents.

This front-end web application is a meteor app (www.meteor.com). 
Meteor is a Node.js-based framework, so it is JavaScript. 

Get the Death Star Appliance 
============================

The Death Star appliance can run on any system that supports KVM or VirtualBox
virtualization. It is a 3.5GB image. 

To install on RHEL or Fedora, run the following command:

curl -L www.tinyurl/get-deathstar | sh

This will download and install the appliance.

There is no automated installer for Ubuntu or Mac OS X at this time.
 
To install the appliance on another KVM system or in VirtualBox, grab the 
appliance image from www.tinyurl.com/get-deathstar-image

To run the appliance in VirtualBox, convert the image to VirtualBox format with:

VBoxManage convertdd deathstar-appliance-sda.raw deathstar-appliance.vdi

Contributing Code
=================

The Death Star appliance exposes a web-browser based IDE on port 10108.

You can use this to examine, and modify the source code of the running application.

To contribute patches, fork the github repository for the application at
www.github.com/jwulf/deathstar-appliance.

Then in the IDE, change your local appliance to track and commit to your fork.

In the Console at the bottom of the screen issue this command:

git remote set-url origin <your-git-fork-clone-url>

For example, to change my appliance from the read-only checkout to a writable one
I used the URL git@github.com:jwulf/deathstar-appliance.git.




