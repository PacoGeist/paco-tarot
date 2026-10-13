import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8766/index.html#/'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='/home/claude/tarot/t-home.png', full_page=True)
        ids = await pg.evaluate("Store.all().map(i=>i.id)"); print('items', len(ids))
        bad=[]
        routes = ['#/list/tarot','#/list/tarot?d=1','#/list/tarot?h=1','#/deck','#/learn','#/learn/lessons','#/learn/symbols','#/learn/flash','#/record','#/journal','#/moon','#/favorites','#/mine','#/more','#/settings','#/credits','#/search?q=love','#/search?q=tower','#/phase/Full%20Moon','#/card/XVI%20%C2%B7%20The%20Tower']
        for r in routes + ['#/view/'+i for i in ids] + ['#/reading/'+i for i in ids[:5]]:
            await pg.evaluate(f"location.hash={json.dumps(r)}"); await pg.wait_for_timeout(120)
            t = await pg.evaluate("document.querySelector('#view').innerText.length")
            if t < 40: bad.append(r)
        print('bad', bad)
        await pg.evaluate("location.hash='#/search?q=tower'"); await pg.wait_for_timeout(400); await pg.screenshot(path='/home/claude/tarot/t-search.png')
        # import a witch backup
        data = {"app":"witchcraft-companion","items":[{"id":"spell-u-1","type":"spell","name":"x"},{"id":"tarot-u-1","type":"tarot","name":"My Witch's Path","positions":[{"n":1,"name":"A","x":0,"y":0}]}],"readings":[{"id":"reading-x","spreadId":"tarot-daily-three","spreadName":"Daily Three","at":1760000000000,"moon":"Full Moon","question":"","notes":"","results":"","outcome":"","positions":[],"cards":[{"n":1,"pos":"Past","posMeaning":"","card":"XVI · The Tower"}]}],"workings":[{"id":"w1","type":"spell","name":"s"}],"favs":["herb-sage","tarot-celtic-cross"],"settings":{"title":"Paco Morningstar's Witches' Companion","theme":"night"},"craft":{}}
        open('/tmp/bk.json','w').write(json.dumps(data))
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(500)
        async with pg.expect_file_chooser() as fc:
            await pg.click('#imp')
        ch = await fc.value; await ch.set_files('/tmp/bk.json'); await pg.wait_for_timeout(500)
        await pg.click('.modal [data-yes]'); await pg.wait_for_timeout(800)
        print('after import:', await pg.evaluate("[Journal.list.length, Workings.list.length, Object.keys(Store.user), [...Store.favs], Store.settings.title]"))
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(500)
        print('title', await pg.evaluate("document.querySelector('.hero h1').textContent"))
        print(errs[:5]); await b.close()
asyncio.run(main())
