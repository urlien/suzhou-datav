import os
import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1920,1080")
opts.add_argument("--use-angle=swiftshader")
opts.add_argument("--enable-unsafe-swiftshader")
opts.add_argument("--ignore-gpu-blocklist")

driver = webdriver.Edge(options=opts)
driver.get("http://localhost:3000/")
time.sleep(4)
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshot.png")
driver.save_screenshot(out_path)
print(f"saved: {out_path}")
driver.quit()
