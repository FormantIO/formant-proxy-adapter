import os
import time
import json
import pathlib
import isodate
import datetime

from onvif import ONVIFCamera

from formant.sdk.agent.v1 import Client as FormantClient

DEFAULT_ONVIF_IP = "192.168.1.110"
DEFAULT_ONVIF_PORT = 80
DEFAULT_ONVIF_USERNAME = "admin"
DEFAULT_ONVIF_PASSWORD = "123456"
DEFAULT_PTZ_RATE = 1.0
DEFAULT_ZOOM_RATE = 0.5
CONTINUOUS_MOVE_TIMEOUT = isodate.Duration(seconds=3)
PUBLISH_THROTTLE_SECONDS = 5.0


class FormantProxyAdapter:
    def __init__(self):
        print("Initializing Formant proxy adapter")


if __name__ == "__main__":
    FormantProxyAdapter()
