#!/usr/bin/env python3
"""Validate a shoot-ready script against the Skill output contract."""

from __future__ import annotations

import argparse
from pathlib import Path
import re


REQUIRED_SECTIONS = (
    "剧本标题与本集任务",
    "拍摄前必看",
    "准备清单",
    "人物表演规则",
    "逐场、逐镜头拍摄剧本",
    "本集爆点与伏笔",
    "剪辑与发布建议",
    "拍摄验收表",
)

SCENE_FIELDS = (
    "位置",
    "出场人物",
    "空间动作",
    "镜头怎么拍",
    "人物动作",
    "台词",
    "屏幕花字",
    "环境音 / BGM",
    "沉默和停留时间",
    "剪辑注意事项",
    "本场功能",
)

PROHIBITED_ENGAGEMENT_PATTERNS = (
    r"(?:冒充|假装|伪装|扮成)(?:真人|真实用户|观众|网友|粉丝)",
    r"虚假评论",
    r"水军",
    r"控评",
    r"(?:虚假|假冒|伪造|机器人|机器|批量)(?:用户)?账号|假账号",
    r"(?:购买|买|刷|批量生成|伪造|制造)(?:虚假)?(?:评论|留言|点赞|转发|互动|热度)",
    r"(?:伪装|包装|冒充)成?(?:自然|真实)(?:热度|互动|评论)",
    r"(?:两派|小号|账号|评论区)[^，。；;\n]{0,8}带节奏|组织两派",
    r"操纵舆论|冒用身份",
    r"刷(?:量|粉|赞|播放|互动)",
)
SCENE_HEADING = re.compile(r"^###\s+【场\s*\d+[^】]*】", re.MULTILINE)
SECTION_HEADING = re.compile(r"^##\s+(?P<title>.+?)\s*$", re.MULTILINE)
NEXT_SCENE_FIELD = re.compile(
    rf"^-[ \t]*(?:{'|'.join(re.escape(field) for field in SCENE_FIELDS)})[：:]",
    re.MULTILINE,
)


def _scene_blocks(text: str) -> list[str]:
    matches = list(SCENE_HEADING.finditer(text))
    blocks: list[str] = []
    for index, match in enumerate(matches):
        candidates = [matches[index + 1].start()] if index + 1 < len(matches) else []
        next_section = re.search(r"^##\s+", text[match.end() :], re.MULTILINE)
        if next_section:
            candidates.append(match.end() + next_section.start())
        end = min(candidates) if candidates else len(text)
        blocks.append(text[match.start() : end])
    return blocks


def _meaningful_assignment(text: str) -> bool:
    owner = re.search(r"责任人\s*[=：:]\s*([^；;】。\n]+)", text)
    timing = re.search(r"(?:确认)?时点\s*[=：:]\s*([^；;】。\n]+)", text)
    if not owner or not timing:
        return False
    exact_placeholders = {
        "姓名",
        "名字",
        "某人",
        "负责人",
        "责任人",
        "待定",
        "待确认",
        "未知",
        "xx",
        "xxx",
        "name",
        "owner",
        "tbd",
        "tbc",
        "todo",
        "placeholder",
        "时点",
        "时间",
        "time",
    }
    placeholder_fragments = ("填写", "请填", "姓名", "名字", "某人", "某某", "待定", "待确认", "未知", "占位")
    for match in (owner, timing):
        raw_value = match.group(1).strip()
        value = raw_value.strip("[]【】<>").lower()
        if (
            not re.search(r"[\w\u4e00-\u9fff]", value)
            or value in exact_placeholders
            or any(fragment in value for fragment in placeholder_fragments)
            or re.search(r"x{2,}", value, re.IGNORECASE)
            or any(marker in raw_value for marker in "<>[]【】")
        ):
            return False
    return True


def _is_safety_prohibition(line: str, phrase_offset: int) -> bool:
    before_phrase = line[:phrase_offset]
    adversatives = list(re.finditer(r"但(?:是)?|不过|然而|却", before_phrase))
    segment = line[adversatives[-1].end() :] if adversatives else line
    normalized = re.sub(r"^[\s，,；;。.!！?？>*-]*(?:\[[ xX]\])?\s*", "", segment)
    if normalized.startswith(
        (
            "不得不",
            "不能不",
            "不可不",
            "不允许不",
            "避免不了",
            "拒绝不了",
            "并非不",
            "不是不",
            "不反对",
            "不拒绝",
            "不禁止",
            "不排除",
            "不限制",
            "不介意",
            "严禁不",
            "禁止不",
            "杜绝不",
            "切勿不",
        )
    ):
        return False
    if normalized.startswith("无") and not normalized.startswith("无论"):
        return True
    return normalized.startswith(
        (
            "不生成",
            "不做",
            "不搞",
            "不用",
            "不安排",
            "不使用",
            "不注册",
            "不组织",
            "不雇佣",
            "不进行",
            "不设计",
            "不采用",
            "不实施",
            "不制造",
            "不伪造",
            "不输出",
            "不提供",
            "不冒充",
            "不冒用",
            "不操纵",
            "不购买",
            "不买",
            "不刷",
            "不控评",
            "不带节奏",
            "不得",
            "禁止",
            "严禁",
            "杜绝",
            "切勿",
            "拒绝",
            "避免",
            "不能",
            "不可",
            "不允许",
        )
    )


def _field_value(text: str, field: str) -> str | None:
    match = re.search(rf"^-[ \t]*{re.escape(field)}[：:][ \t]*(.*)$", text, re.MULTILINE)
    if not match:
        return None
    value = match.group(1).strip()
    return value or None


def _list_items(value: str) -> list[str]:
    return [
        item.strip().rstrip("。.;；")
        for item in re.split(r"[、,，]", value)
        if item.strip().rstrip("。.;；")
    ]


def _space_name(value: str) -> str:
    return value.strip().rstrip("。.;；")


def _parse_duration_seconds(value: str) -> int | None:
    normalized = re.sub(r"\s+", "", value)
    clock = re.search(r"(?<!\d)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?!\d)", normalized)
    if clock:
        first, second, third = (int(part) if part is not None else None for part in clock.groups())
        if third is None:
            return first * 60 + second
        return first * 3600 + second * 60 + third

    hours = re.search(r"(\d+(?:\.\d+)?)小时", normalized)
    minutes = re.search(r"(\d+(?:\.\d+)?)分(?:钟)?", normalized)
    seconds = re.search(r"(\d+(?:\.\d+)?)秒", normalized)
    if hours or minutes or seconds:
        total = 0.0
        if hours:
            total += float(hours.group(1)) * 3600
        if minutes:
            total += float(minutes.group(1)) * 60
        if seconds:
            total += float(seconds.group(1))
        return round(total)

    bare = re.search(r"\d+", normalized)
    return int(bare.group()) if bare else None


def _has_closed_door_entry_conflict(block: str) -> bool:
    conflict = re.compile(
        r"(?:门[^\n，。；;]*(?:保持关闭|没打开|没有打开)|未开门)"
        r"[^\n。；;]*直接(?:进入|进到|进去)"
    )
    for line in block.splitlines():
        if conflict.search(line) and not re.search(r"(?:不得|禁止|不能|避免).*直接(?:进入|进到|进去)", line):
            return True
    return False


def _validate_sections(text: str) -> list[str]:
    errors: list[str] = []
    headings = list(SECTION_HEADING.finditer(text))
    previous_position = -1
    for section in REQUIRED_SECTIONS:
        matching = [match for match in headings if section in match.group("title")]
        if not matching:
            errors.append(f"缺少栏目标题：{section}")
            continue
        match = matching[0]
        if match.start() < previous_position:
            errors.append(f"栏目顺序错误：{section}")
        else:
            previous_position = match.start()
        heading_index = headings.index(match)
        content_end = (
            headings[heading_index + 1].start()
            if heading_index + 1 < len(headings)
            else len(text)
        )
        if not text[match.end() : content_end].strip():
            errors.append(f"栏目内容为空：{section}")
    return errors


def validate(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors = _validate_sections(text)

    for match in re.finditer(r"【待现场确认(?P<body>[^】]*)】", text):
        body = match.group("body")
        following = text[match.end() : match.end() + 120]
        assigned = _meaningful_assignment(body) or _meaningful_assignment(following)
        if not assigned:
            errors.append("存在未解决的待现场确认项")

    engagement_errors: set[str] = set()
    for pattern in PROHIBITED_ENGAGEMENT_PATTERNS:
        for match in re.finditer(pattern, text):
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_end = text.find("\n", match.end())
            line = text[line_start : line_end if line_end >= 0 else len(text)]
            if not _is_safety_prohibition(line, match.start() - line_start):
                error = f"包含禁止的虚假互动方案：{match.group(0)}"
                if error not in engagement_errors:
                    errors.append(error)
                    engagement_errors.add(error)
                break

    header = text.split("## 2.", 1)[0]
    declared_people_value = _field_value(header, "登场人物")
    declared_people = set(_list_items(declared_people_value)) if declared_people_value else set()
    if not declared_people:
        errors.append("缺少登场人物声明")

    route_value = _field_value(header, "空间路径")
    route = (
        [_space_name(item) for item in re.split(r"[>＞]", route_value) if _space_name(item)]
        if route_value
        else []
    )
    if not route:
        errors.append("缺少空间路径声明")

    duration_match = re.search(r"目标总时长[：:]\s*([^\n]*)", text)
    target_duration = None
    if duration_match:
        target_duration = _parse_duration_seconds(duration_match.group(1))
    if target_duration is None:
        errors.append("缺少目标总时长或时长不是数字")

    scenes = _scene_blocks(text)
    if not scenes:
        errors.append("缺少可识别的场次")
    scene_durations: list[int] = []
    previous_space_index: int | None = None
    for index, block in enumerate(scenes, start=1):
        heading = block.splitlines()[0]
        scene_duration = re.search(r"预计\s*(\d+)\s*秒", heading)
        if not scene_duration:
            errors.append(f"场次缺少预计时长：场 {index}")
        else:
            scene_durations.append(int(scene_duration.group(1)))
        for field in SCENE_FIELDS:
            field_match = re.search(
                rf"^-[ \t]*{re.escape(field)}[：:][ \t]*(.*)$", block, re.MULTILINE
            )
            if not field_match:
                errors.append(f"场次缺少字段：场 {index} / {field}")
            elif not field_match.group(1).strip():
                following = block[field_match.end() :]
                next_field = NEXT_SCENE_FIELD.search(following)
                nested_content = following[: next_field.start() if next_field else len(following)]
                if not nested_content.strip():
                    errors.append(f"场次字段为空：场 {index} / {field}")

        scene_people_value = _field_value(block, "出场人物")
        if scene_people_value and declared_people:
            for person in _list_items(scene_people_value):
                if person not in declared_people:
                    errors.append(f"场次出现未声明人物：场 {index} / {person}")

        location_value = _field_value(block, "位置")
        if location_value and route:
            location = _space_name(location_value)
            if location not in route:
                errors.append(f"场次位置不在空间路径：场 {index} / {location}")
            else:
                matching_indices = [
                    route_index
                    for route_index, route_location in enumerate(route)
                    if route_location == location
                ]
                if previous_space_index is None:
                    space_index = 0 if route[0] == location else matching_indices[0]
                elif location == route[previous_space_index]:
                    space_index = previous_space_index
                elif (
                    previous_space_index + 1 < len(route)
                    and location == route[previous_space_index + 1]
                ):
                    space_index = previous_space_index + 1
                else:
                    future = [item for item in matching_indices if item > previous_space_index]
                    if future:
                        space_index = future[0]
                        errors.append(f"空间路径跨级：场 {index} / {location}")
                    else:
                        space_index = matching_indices[-1]
                        errors.append(f"空间路径倒退：场 {index} / {location}")

                if index == 1 and space_index != 0:
                    errors.append(f"空间路径起点不一致：场 {index} / {location}")
                previous_space_index = space_index

        if _has_closed_door_entry_conflict(block):
            errors.append(f"存在门未打开却直接进入的空间矛盾：场 {index}")

    if target_duration is not None and len(scene_durations) == len(scenes):
        total = sum(scene_durations)
        if total != target_duration:
            errors.append(
                f"分场时长合计 {total} 秒与目标总时长 {target_duration} 秒不一致"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", type=Path, help="Markdown shooting script")
    args = parser.parse_args()

    errors = validate(args.script)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("VALID")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
