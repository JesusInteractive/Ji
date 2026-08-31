# Screen recording narration script: "Changing a Play subscription price two ways"

Not a video file -- a script to read while you record your own screen,
per your own request. Roughly 4-5 minutes at a normal talking pace.

---

## Part 1 -- Doing it by hand in Play Console (~90 seconds)

**[Screen: Play Console home]**

"Let's start with the manual way, since it's good to understand what
the CLI is actually doing under the hood.

**[Click: Monetize with Play, in the left sidebar]**

I'll go to Monetize with Play...

**[Click: Products -> Subscriptions]**

...then Products, then Subscriptions. Here are our four subscription
products: Basic, Pro_monthly, Platinum, and Platinum_Yearly.

**[Click the arrow/chevron next to "Platinum"]**

I'll click into Platinum...

**[Click: the platinum_monthly base plan row]**

...and open its base plan, platinum_monthly.

**[Scroll to: Price and availability section]**

Down here is Price and availability. This table isn't click-to-edit --
you select the region you want with its checkbox...

**[Click: search box, type "United States", check the row]**

...so I'll search for United States, check that row...

**[Click: Set price button at the bottom]**

...and click Set price. This opens the actual editable price field.

**[Type the new price, e.g. 19.99]**

I'll type in the new price...

**[Click: Save / Update]**

...and save. Play tells you this applies to new subscribers within a
few hours, and existing subscribers keep their current price unless you
separately migrate them -- more on that in a moment."

---

## Part 2 -- The same change via the CLI (~90 seconds)

**[Screen: terminal, tools/play-pricing directory]**

"Now the same exact change, from the command line. First, a dry run so
I can see exactly what would be sent before anything actually happens.

**[Type/run:]**
```
npm run prices -- set --product Platinum --base platinum_monthly --region US --amount 19.99 --currency USD --dry-run
```

**[Let the JSON output print]**

Notice it prints the full request body -- this is the whole
subscription's base plans array, not just the one region, because
Play's API replaces the entire field on a patch, not just one element
inside it. The tool handles that merge for you automatically so nothing
else gets accidentally wiped out.

Once I'm happy with what it's about to send, I drop --dry-run and run
it for real:

**[Type/run:]**
```
npm run prices -- set --product Platinum --base platinum_monthly --region US --amount 19.99 --currency USD
```

And that's the identical change we just made by hand in Play Console,
done from a script instead -- which is what actually matters once
you're doing this across many regions or many products at once, not
just one price in one country."

---

## Part 3 -- The migration warning (~60 seconds)

**[Screen: terminal, or back to Play Console's base plan page]**

"One more thing, and this is the part to genuinely be careful with. The
price change we just made only affects NEW subscribers. Everyone who's
already subscribed keeps paying their old price, forever, unless you
run one more, separate command:

**[Type/run, dry-run only -- do not actually execute in the recording:]**
```
npm run prices -- migrate --product Platinum --base platinum_monthly --regions US --dry-run
```

This is deliberately its own command, not something that happens
automatically, because running it for real moves EXISTING, PAYING
subscribers onto the new price. Play shows them an in-app prompt asking
them to accept the new price, and anyone who declines can have their
subscription cancelled instead of migrated. That's a real, visible
moment for real subscribers, not a quiet backend update.

So: change the price, let it settle for new buyers, and only run the
migrate step later, deliberately, once you've actually decided you want
existing subscribers moved onto it too -- and ideally after you've
given them a heads-up, not as a surprise."

**[End recording]**
