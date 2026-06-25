import { Clock, Database, HardDriveUpload, Shield } from "lucide-react";

export default function Info() {
  return (
    <section className="text-background dark:text-foreground hidden flex-col justify-center gap-4 bg-mist-900 p-12 lg:flex lg:w-1/2 dark:bg-mist-800">
      <h1 className="text-4xl leading-tight font-bold">
        Manage your PostgreSQL backups with confidence
      </h1>
      <p className="text-background/70 dark:text-foreground/70 text-lg leading-relaxed">
        Create, restore, migrate, and manage database backups with customizable
        flags and one-click operations.
      </p>

      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="bg-background/10 flex size-10 items-center justify-center rounded-full">
            <Database className="size-5" />
          </div>
          <div>
            <p className="font-medium">Full pg_dump/pg_restore Support</p>
            <p className="text-background/60 dark:text-foreground/60 text-sm">
              Configure all backup and restore flags
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-background/10 flex size-10 items-center justify-center rounded-full">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="font-medium">Automated Backups</p>
            <p className="text-background/60 dark:text-foreground/60 text-sm">
              Automatically backup your database with a cron job
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-background/10 flex size-10 items-center justify-center rounded-full">
            <HardDriveUpload className="size-5" />
          </div>
          <div>
            <p className="font-medium">Migrate data easily</p>
            <p className="text-background/60 dark:text-foreground/60 text-sm">
              Migrate data from one database to another with ease
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-background/10 flex size-10 items-center justify-center rounded-full">
            <Shield className="size-5" />
          </div>
          <div>
            <p className="font-medium">Secure Connection Storage</p>
            <p className="text-background/60 dark:text-foreground/60 text-sm">
              Encrypted credentials with masked display
            </p>
          </div>
        </div>
      </div>
      <p className="text-background/50 dark:text-foreground/50 mt-auto text-sm">
        Built for developers who need reliable database backups
      </p>
    </section>
  );
}
