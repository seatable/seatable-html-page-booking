# seatable-html-page-booking

View availability and book instantly.

## Required tables

### Intervals

Table name: Intervals

Required fields:

| Name  | Type | Description                                                                                 |
| ----- | ---- | ------------------------------------------------------------------------------------------- |
| name  | text | interval name                                                                               |
| week  | text | week. valid options include: monday、tuesday、wednesday、thursday、friday、saturday、sunday |
| start | text | start time. format: e.g. '08:00'                                                            |
| end   | text | end time. format: e.g. '18:00'                                                              |

### Resources

Table name: Resources

Required fields:

| Name      | Type | Description         |
| --------- | ---- | ------------------- |
| name      | text | resource name       |
| intervals | link | linked to Intervals |

### Bookings

Table name: Bookings

Required fields:

| Name        | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| name        | text     | -                                     |
| start_time  | date     | start time                            |
| end_time    | date     | end time. format: e.g. '08:00'        |
| end         | text     | end time. format: e.g. '18:00'        |
| is_canceled | checkbox | whether the booking has been canceled |
| resource    | link     | linked to Resources                   |

## Development

1. Install dependencies

2. Add `/src/setting.js` (optional)

```js
export default {
  server: "",
  appUuid: "",
  accountToken: "",
  pageId: "", // create an html page in universal app first
};
```

3. Run the following command to start the development server

```bash
npm run dev
```

## Build page

1. Update the version in `package.json`

2. Run the following command to build the page

```bash
npm run build-page
```

3. The page is built in `page-zip` directory
