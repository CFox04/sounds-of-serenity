import os

from flask import Flask, render_template
from livereload import Server
app = Flask(__name__)

# Loads a directory's file structure into a dictionary


def loadDirectory(directory):
    directoryList = []

    for entry in os.scandir(directory):
        if entry.is_dir():
            directoryList.append(
                {entry.name: loadDirectory(f'{directory}/{entry.name}')})
        else:
            directoryList.append(entry.name)

    return directoryList


@app.route('/')
def index():
    audioNames = loadDirectory('./static/audio')
    return render_template('/index.html', audioNames=audioNames)


@app.route('/credits')
def credits():
    return render_template('/credits.html')

if __name__ == '__main__':
    server = Server(app.wsgi_app)
    server.serve()
    # app.run(host='0.0.0.0')
