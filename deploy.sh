cd web_ui;
yarn build --base=/static/;
cp -r dist/* ../hubase/front/;
cd ../hubase;
source venv/bin/activate;
pip install -r requirements.txt;
cd ..;
sudo nohup ~/hubase/start.sh >logs.log 2>&1 </dev/null &
