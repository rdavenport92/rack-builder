This project was created with the intention of building a UI that will ultimately allow a user to virtually design custom datacenter racks. The primary end goal is to allow the user to create an inventory of accessories (including cabinets, data center appliances, a variety of cable and optic types, etc.), to integrate the accessories into the cabinet of his/her choice and to export the project into a spreadsheet format that will contain a BOM, cable schematic (including recommended cable lengths) and rack elevation. For this project, I am utilizing Angular and Electron - bootstrapped with https://github.com/maximegris/angular-electron.git

After installing all necessary dependencies with npm install/yarn, issue a yarn start/npm start to run the project in a native electron environment. In order to run the project in a web browser, issue yarn run ng:serve:web/ npm run ng:serve:web to view the app in a web browser. 

CONTROLS: 

In its current state, you can toggle edit modes with numpad 1, 2 and 3 or by selecting the buttons most closely aligned to the left. These modes allow you to edit your cabinet at different levels of granularity: 1 - cabinet level, 2 - RU level, 3 - integration level (cables, optics, etc.)

If you select a single cabinet, while it's highlighted, you can toggle cabinet edit mode to enter single cabinet vs. multi cabinet. You also have the ability to rotate using numpad 4, 5 and 6. Toggle 5 or front/rear button to switch between front and rear view.


