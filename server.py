from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from queue import Queue, Empty
import threading
import time
import uuid
import os

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# {timer_id: {'queue': Queue, 'active': bool}}
timers = {}


def _run_timer(timer_id, seconds, q):
    end = time.monotonic() + seconds
    while True:
        remaining = end - time.monotonic()
        if remaining <= 0:
            if timers.get(timer_id, {}).get('active'):
                q.put('alarm')
            break
        time.sleep(min(1.0, remaining))


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(os.path.join(app.root_path, 'public'), filename)


@app.route('/api/timer/start', methods=['POST'])
def start_timer():
    data = request.get_json(silent=True) or {}
    seconds = int(data.get('duration', 0))
    if seconds <= 0:
        return jsonify({'error': 'Invalid duration'}), 400

    timer_id = str(uuid.uuid4())
    q = Queue()
    timers[timer_id] = {'queue': q, 'active': True}
    threading.Thread(target=_run_timer, args=(timer_id, seconds, q), daemon=True).start()
    return jsonify({'timer_id': timer_id})


@app.route('/api/timer/stop', methods=['POST'])
def stop_timer():
    data = request.get_json(silent=True) or {}
    timer_id = data.get('timer_id')
    if timer_id and timer_id in timers:
        timers[timer_id]['active'] = False
        timers[timer_id]['queue'].put('stop')
    return jsonify({'status': 'stopped'})


@app.route('/api/timer/events/<timer_id>')
def timer_events(timer_id):
    def generate():
        yield 'data: connected\n\n'
        entry = timers.get(timer_id)
        if not entry:
            yield 'event: error\ndata: not found\n\n'
            return
        q = entry['queue']
        while True:
            try:
                event = q.get(timeout=20)
            except Empty:
                if not timers.get(timer_id, {}).get('active'):
                    break
                yield ': keepalive\n\n'
                continue
            if event == 'alarm':
                yield 'event: alarm\ndata: done\n\n'
            elif event == 'stop':
                yield 'event: stop\ndata: stopped\n\n'
            break

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        },
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
