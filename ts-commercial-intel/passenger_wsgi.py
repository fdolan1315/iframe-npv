"""Production entry point (Passenger / mod_wsgi).

Passenger imports this file and looks for `application`. All request handling
lives in serve.py so the dev server and production run identical code.

On cPanel-style hosts Passenger may run an older interpreter than the one you
installed; if so, set the app's Python version in the hosting panel rather than
re-exec'ing here.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from serve import application, init_db  # noqa: E402

init_db()
