#!/usr/bin/env python

import os
import sys
import argparse
from typing import Dict
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.engine import Engine
from sqlalchemy import create_engine, text
load_dotenv()

class BlogDBConnector:
    def __init__(self, db_config : Dict[str, str]) -> None:
        self.db_config = db_config
        self.engine = None

    def connect(self) -> None:
        conn_string = (
            f"{self.db_config['db_engine']}://{self.db_config['user']}:{self.db_config['password']}"
            f"@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['dbname']}"
        )
        self.engine = create_engine(conn_string)
        print("Initialized DB engine")

    def insert_post(self, title : str, slug : str, content : str, draft: bool = False) -> None:
        if not self.engine:
            raise RuntimeError("No db engine. Please connect() first")
        published_at = None if draft else datetime.now()
        try:
            query = text("""
                INSERT INTO blog.posts (title, slug, content, published_at)
                VALUES (:title, :slug, :content, :published_at);
            """)
            with self.engine.connect() as connection:
                with connection.begin():
                    connection.execute(query, {
                        'title': title,
                        'slug': slug,
                        'content': content,
                        'published_at': published_at
                    })
        except Exception as e:
            print(f"Error: {e}")
            raise

    def close(self) -> None:
        if self.engine:
            self.engine.dispose()
            print("Disposed of SQLAlchemy engine")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('-t','--title', help="Blog post title")
    parser.add_argument('-s','--slug', help="URL slug identifying the post/app router path")
    parser.add_argument('-f','--filepath', help="URL slug identifying the post/app router path")
    parser.add_argument('--draft', action='store_true', help="Insert as a draft (will not appear on site until published)")
    args = parser.parse_args()

    DB_CONFIG = {
	'dbname': os.getenv('DB_NAME'),
	'user': os.getenv('DB_USER'),
	'password': os.getenv('DB_PASSWORD'),
	'host': os.getenv('DB_HOST'),
	'port': os.getenv('DB_PORT'),
	'db_engine': os.getenv('DB_ENGINE')
    }

    try:
        with open(args.filepath, 'r') as fp:
            content: str = fp.read()
    except FileNotFoundError:
        print(f"Error: File '{args.filepath}' not found")
        parser.exit(1)


    db = BlogDBConnector(DB_CONFIG)
    try:
        db.connect()
        db.insert_post(args.title, args.slug, content, args.draft)
    except Exception as e:
        print(f"Failure: {e}")
        parser.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
