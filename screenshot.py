from selenium import webdriver
from selenium.webdriver.edge.options import Options
import time

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1920,1080")
opts.add_argument("--disable-gpu")

driver = webdriver.Edge(options=opts)
driver.get("http://localhost:3000/")
time.sleep(5)
driver.save_screenshot("D:/suzhou-datav/screenshot.png")
print("saved")
driver.quit()
