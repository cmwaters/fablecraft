# Permissions

Fablecraft uses a permissioned system to determine what requests a user can make. The story struct holds a list of user id's which for each api call by an authenticated user can extract the corresponding permission that the user has with the story. This document sets to outline the actions that can be made. The permission system has 5 tiers (in order of increasing acces):

1. None:

The user is unable to do anything. All calls return a `Story Does Not Exist` error

2. Viewer:

The user is able to view the story details and all the cards, comments and elements that correspond to the story. 

3. Editor:

Everything a viewer can do as well as the user can make suggestions for changes and add comments.

4. Author:

Everything an editor can do as well as create, delete, edit and move cards. Give editor and viewing access to other users. Change the title and description of the story. Other minor setting changes

5. Owner:

Everything an editor can do as well as delete the story, change ownership, give author access to other users
